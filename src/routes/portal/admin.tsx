import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Copy, PencilLine, Search, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PortalShell } from '../../components/portal/PortalShell'
import { buildCustomerPortalUrl, generateSecureCustomerPortalSlug } from '../../lib/customer-links'
import { getAuthenticatedAdmin } from '../../lib/portal-auth'
import { DEFAULT_WEBSITE_CONTENT, deepCloneWebsiteContent, WEBSITE_CONTENT_VERSION } from '../../lib/site-content'
import { addPortalServiceHistoryEntry, getPortalState, createPortalCustomer, deletePortalCustomer, hydratePortalStateFromSupabase, removePortalGalleryItem, removePortalServiceHistoryEntry, updatePortalCustomer, updatePortalGallery, updatePortalServiceHistoryEntry, updatePortalVehicle, updatePortalWebsiteContent } from '../../lib/portal-session'
import type { AdminGalleryItem, CustomerProfile, PortalState, PublicProjectContent, PublicServiceContent, ServiceHistoryEntry, VehicleRecord, WarrantyRecord, WebsiteContent } from '../../types/portal'

export const Route = createFileRoute('/portal/admin')({
  component: AdminPage,
})

const DEFAULT_WARRANTY_TERMS = `Η εγγύηση καλύπτει την εγκατάσταση και τη λειτουργία του προϊόντος για τη διάρκεια της συμφωνίας, υπό προϋποθέσεις που ορίζονται στο έγγραφο της Glowworks. Η κάλυψη περιλαμβάνει επισκευή ή αντικατάσταση σε περίπτωση βλάβης που αποδίδεται σε ελαττωματικό υλικό ή εργασία. Η εγγύηση δεν καλύπτει φθορές από κακή χρήση, μηχανική βλάβη, τροποποιήσεις ή ζημιές που προκύπτουν από φυσική καταστροφή.`

const SERVICE_PRESET_OPTIONS = ['Ambient Lighting', 'Starlight Headliner', 'Alcantara Interior', 'Carbon Trim', 'Premium Audio', 'Sunroof', 'Seat Upgrade', 'Interior Mood Lighting', 'Custom Trim', 'Other']

const makeCustomerDraft = (): CustomerProfile => ({
  id: `cust-${Math.random().toString(36).slice(2, 8)}`,
  customerCode: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  loyaltyTier: 'Standard',
  createdAt: new Date().toISOString().slice(0, 10),
  discountEnabled: false,
  discountCode: '',
})

const makeVehicleDraft = (customerId = ''): VehicleRecord => ({
  id: `veh-${Math.random().toString(36).slice(2, 8)}`,
  customerId,
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  plate: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  nfcTagId: '',
})

const makeWarrantyDraft = (customerId = '', vehicleId = ''): WarrantyRecord => ({
  id: `w-${Math.random().toString(36).slice(2, 8)}`,
  customerId,
  vehicleId,
  product: '',
  status: 'Active',
  installedAt: 'Glowworks Rhodes Studio',
  startsOn: new Date().toISOString().slice(0, 10),
  endsOn: new Date().toISOString().slice(0, 10),
  coverage: '',
  notes: '',
  warrantyNumber: '',
  durationYears: 2,
  installationDate: new Date().toISOString().slice(0, 10),
  terms: DEFAULT_WARRANTY_TERMS,
})

const makeGalleryDraft = (customerId?: string): AdminGalleryItem => ({
  id: `gallery-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  description: '',
  imageUrl: '',
  category: 'customer',
  featured: false,
  customerId,
})

const makeServiceDraft = () => ({
  title: '',
  completedOn: new Date().toISOString().slice(0, 10),
  vehicle: '',
  notes: '',
  servicePreset: 'Ambient Lighting',
  warrantyNumber: '',
  warrantyStartsOn: new Date().toISOString().slice(0, 10),
  warrantyEndsOn: new Date().toISOString().slice(0, 10),
  warrantyCoverage: '',
  warrantyNotes: '',
})

type SearchableSelectProps = {
  value: string
  onSelect: (value: string) => void
  options: string[]
  placeholder: string
  emptyText: string
}

function SearchableSelect({ value, onSelect, options, placeholder, emptyText }: SearchableSelectProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return options
    }

    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [options, query])

  const commitSelection = (option: string) => {
    onSelect(option)
    setQuery(option)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setQuery('')
    setOpen(true)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions.length) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((current) => (current + 1) % filteredOptions.length)
        setOpen(true)
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((current) => (current <= 0 ? filteredOptions.length - 1 : current - 1))
        setOpen(true)
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0) {
          commitSelection(filteredOptions[highlightedIndex])
        } else {
          commitSelection(filteredOptions[0])
        }
        break
      case 'Escape':
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setHighlightedIndex(-1)
        }}
        onFocus={handleInputFocus}
        onClick={() => setOpen(true)}
        onMouseDown={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {open && filteredOptions.length ? (
        <div className="searchable-options">
          {filteredOptions.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`searchable-option${index === highlightedIndex ? ' active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault()
                commitSelection(option)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      {open && !filteredOptions.length ? (
        <div className="searchable-options empty">{emptyText}</div>
      ) : null}
    </div>
  )
}

function AdminPage() {
  const [state, setState] = useState<PortalState>(() => getPortalState())
  const [websiteContentDraft, setWebsiteContentDraft] = useState<WebsiteContent>(() => deepCloneWebsiteContent(getPortalState().websiteContent ?? DEFAULT_WEBSITE_CONTENT))
  const [selectedProjectDraftId, setSelectedProjectDraftId] = useState('')
  const [selectedServiceDraftId, setSelectedServiceDraftId] = useState('')
  const [selectedBrandDraftName, setSelectedBrandDraftName] = useState('')
  const [selectedModelDraftName, setSelectedModelDraftName] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandFirstModel, setNewBrandFirstModel] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerDraft, setCustomerDraft] = useState<CustomerProfile>(makeCustomerDraft)
  const [vehicleDraft, setVehicleDraft] = useState<VehicleRecord>(() => makeVehicleDraft())
  const [galleryDraft, setGalleryDraft] = useState<AdminGalleryItem>(() => makeGalleryDraft())
  const [pendingGalleryImages, setPendingGalleryImages] = useState<string[]>([])
  const [serviceDraft, setServiceDraft] = useState(() => makeServiceDraft())
  const [editingServiceEntryId, setEditingServiceEntryId] = useState<string | null>(null)
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)
  const [adminAccess, setAdminAccess] = useState<'checking' | 'authorized' | 'denied'>('checking')

  useEffect(() => {
    let active = true

    void getAuthenticatedAdmin().then((admin) => {
      if (!active) {
        return
      }
      if (!admin) {
        setAdminAccess('denied')
        window.location.href = '/portal/login'
        return
      }
      setAdminAccess('authorized')
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (adminAccess !== 'authorized') {
      return
    }

    void hydratePortalStateFromSupabase().then((hydratedState) => {
      setState(hydratedState)
      setWebsiteContentDraft(deepCloneWebsiteContent(hydratedState.websiteContent ?? DEFAULT_WEBSITE_CONTENT))
    })
  }, [adminAccess])

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase()
    return state.customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.customerCode, customer.address, customer.email].join(' ').toLowerCase()
      return haystack.includes(query) || customer.name.toLowerCase().includes(query)
    })
  }, [search, state.customers])

  const selectedVehicleModels = useMemo(() => {
    const make = vehicleDraft.make.trim()
    return state.websiteContent.vehicleBrandModels[make] ?? []
  }, [state.websiteContent.vehicleBrandModels, vehicleDraft.make])

  const vehicleBrandOptions = useMemo(
    () => Object.keys(state.websiteContent.vehicleBrandModels ?? {}).sort(),
    [state.websiteContent.vehicleBrandModels],
  )
  const projectSelectorOptions = useMemo(
    () => websiteContentDraft.projects.map((project) => ({
      id: project.id,
      label: project.title?.trim() ? `${project.title} (${project.id})` : project.id,
    })),
    [websiteContentDraft.projects],
  )
  const selectedProjectDraft = useMemo(
    () => websiteContentDraft.projects.find((project) => project.id === selectedProjectDraftId) ?? null,
    [selectedProjectDraftId, websiteContentDraft.projects],
  )
  const selectedProjectSelectorValue = useMemo(
    () => projectSelectorOptions.find((project) => project.id === selectedProjectDraftId)?.label ?? '',
    [projectSelectorOptions, selectedProjectDraftId],
  )
  const serviceSelectorOptions = useMemo(
    () => websiteContentDraft.services.map((service) => ({
      id: service.id,
      label: `${service.title} (${service.id})`,
    })),
    [websiteContentDraft.services],
  )
  const selectedServiceDraft = useMemo(
    () => websiteContentDraft.services.find((service) => service.id === selectedServiceDraftId) ?? null,
    [selectedServiceDraftId, websiteContentDraft.services],
  )
  const selectedServiceSelectorValue = useMemo(
    () => serviceSelectorOptions.find((service) => service.id === selectedServiceDraftId)?.label ?? '',
    [selectedServiceDraftId, serviceSelectorOptions],
  )
  const brandSelectorOptions = useMemo(
    () => Object.keys(websiteContentDraft.vehicleBrandModels).sort(),
    [websiteContentDraft.vehicleBrandModels],
  )
  const selectedBrandModels = useMemo(
    () => websiteContentDraft.vehicleBrandModels[selectedBrandDraftName] ?? [],
    [selectedBrandDraftName, websiteContentDraft.vehicleBrandModels],
  )

  useEffect(() => {
    if (!websiteContentDraft.projects.length) {
      if (selectedProjectDraftId) {
        setSelectedProjectDraftId('')
      }
      return
    }

    if (!selectedProjectDraftId || !websiteContentDraft.projects.some((project) => project.id === selectedProjectDraftId)) {
      setSelectedProjectDraftId(websiteContentDraft.projects[0]?.id ?? '')
    }
  }, [selectedProjectDraftId, websiteContentDraft.projects])

  useEffect(() => {
    if (!websiteContentDraft.services.length) {
      if (selectedServiceDraftId) {
        setSelectedServiceDraftId('')
      }
      return
    }

    if (!selectedServiceDraftId || !websiteContentDraft.services.some((service) => service.id === selectedServiceDraftId)) {
      setSelectedServiceDraftId(websiteContentDraft.services[0]?.id ?? '')
    }
  }, [selectedServiceDraftId, websiteContentDraft.services])

  useEffect(() => {
    if (!brandSelectorOptions.length) {
      if (selectedBrandDraftName) {
        setSelectedBrandDraftName('')
      }
      return
    }

    if (!selectedBrandDraftName || !brandSelectorOptions.includes(selectedBrandDraftName)) {
      setSelectedBrandDraftName(brandSelectorOptions[0] ?? '')
    }
  }, [brandSelectorOptions, selectedBrandDraftName])

  useEffect(() => {
    if (!selectedBrandModels.length) {
      if (selectedModelDraftName) {
        setSelectedModelDraftName('')
      }
      return
    }

    if (!selectedModelDraftName || !selectedBrandModels.includes(selectedModelDraftName)) {
      setSelectedModelDraftName(selectedBrandModels[0] ?? '')
    }
  }, [selectedBrandModels, selectedModelDraftName])

  const openCustomerProfile = (customer: CustomerProfile) => {
    navigate({
      to: '/customer/$customerCode',
      params: { customerCode: customer.customerCode },
    })
  }

  const copyCustomerPortalLink = async (customer: CustomerProfile) => {
    const url = buildCustomerPortalUrl(customer.customerCode, { kind: 'nfc' })

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
        setCopiedCustomerId(customer.id)
        window.setTimeout(() => setCopiedCustomerId((current) => (current === customer.id ? null : current)), 1600)
        return
      } catch {
        // Fall back to the browser prompt below.
      }
    }

    window.prompt('Copy this NFC URL', url)
  }

  const startEditingCustomer = (customer: CustomerProfile) => {
    const existingVehicle = state.vehicles.find((vehicle) => vehicle.customerId === customer.id)
    const existingWarranty = state.warranties.find((warranty) => warranty.customerId === customer.id)
    setCustomerDraft(customer)
    setVehicleDraft(existingVehicle ?? makeVehicleDraft(customer.id))
    setEditingCustomerId(customer.id)
    setSelectedCustomerId(customer.id)
  }

  const cancelCustomerEdit = () => {
    setEditingCustomerId(null)
    setCustomerDraft(makeCustomerDraft())
    setVehicleDraft(makeVehicleDraft())
    setGalleryDraft(makeGalleryDraft())
    setEditingServiceEntryId(null)
    setServiceDraft(makeServiceDraft())
  }

  const resetServiceDraft = () => {
    setServiceDraft(makeServiceDraft())
    setEditingServiceEntryId(null)
  }

  const startEditingService = (entry: ServiceHistoryEntry) => {
    const serviceWarranty = state.warranties.find((warranty) => warranty.id === entry.warrantyId)
    setSelectedCustomerId(entry.customerId)
    setEditingServiceEntryId(entry.id)
    setServiceDraft({
      title: entry.title,
      completedOn: entry.completedOn,
      vehicle: entry.vehicle,
      notes: entry.notes ?? '',
      servicePreset: entry.title || 'Ambient Lighting',
      warrantyNumber: entry.warrantyNumber || serviceWarranty?.warrantyNumber || '',
      warrantyStartsOn: entry.warrantyStartsOn || serviceWarranty?.startsOn || new Date().toISOString().slice(0, 10),
      warrantyEndsOn: entry.warrantyEndsOn || serviceWarranty?.endsOn || new Date().toISOString().slice(0, 10),
      warrantyCoverage: entry.warrantyCoverage || serviceWarranty?.coverage || '',
      warrantyNotes: entry.warrantyNotes || serviceWarranty?.notes || '',
    })
  }

  const handleSaveServiceHistory = () => {
    const customerId = selectedCustomerId ?? editingCustomerId
    if (!customerId) {
      return
    }

    const title = (serviceDraft.title || serviceDraft.servicePreset).trim()
    if (!title) {
      return
    }

    const selectedCustomer = state.customers.find((customer) => customer.id === customerId)
    if (!selectedCustomer) {
      return
    }

    const vehicleLabel = serviceDraft.vehicle.trim() || [vehicleDraft.make, vehicleDraft.model].filter(Boolean).join(' ').trim() || 'Vehicle'
    const autoWarrantyNumber = `W-SVC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const serviceEntry = {
      id: editingServiceEntryId ?? `history-${Date.now()}`,
      customerId: selectedCustomer.id,
      title,
      vehicle: vehicleLabel,
      completedOn: serviceDraft.completedOn,
      notes: serviceDraft.notes.trim(),
      warrantyNumber: serviceDraft.warrantyNumber.trim() || autoWarrantyNumber,
      warrantyStartsOn: serviceDraft.warrantyStartsOn || undefined,
      warrantyEndsOn: serviceDraft.warrantyEndsOn || undefined,
      warrantyCoverage: serviceDraft.warrantyCoverage.trim() || undefined,
      warrantyNotes: serviceDraft.warrantyNotes.trim() || undefined,
    }

    setState((current) => editingServiceEntryId
      ? updatePortalServiceHistoryEntry(serviceEntry as ServiceHistoryEntry, current)
      : addPortalServiceHistoryEntry(serviceEntry as ServiceHistoryEntry, current))

    resetServiceDraft()
  }

  const handleRemoveServiceHistory = (entryId: string) => {
    setState((current) => removePortalServiceHistoryEntry(entryId, current))
  }

  const currentCustomerServices = useMemo(() => {
    const customerId = selectedCustomerId ?? editingCustomerId
    if (!customerId) {
      return []
    }

    return state.serviceHistory.filter((entry) => entry.customerId === customerId).slice().sort((a, b) => b.completedOn.localeCompare(a.completedOn))
  }, [editingCustomerId, selectedCustomerId, state.serviceHistory])

  const saveCustomer = () => {
    if (!customerDraft.name.trim() || !customerDraft.email.trim()) {
      return
    }

    const existingCustomerCode = editingCustomerId
      ? state.customers.find((customer) => customer.id === editingCustomerId)?.customerCode
      : ''

    const nextCustomer: CustomerProfile = {
      ...customerDraft,
      customerCode: (editingCustomerId ? (customerDraft.customerCode?.trim() || existingCustomerCode) : '')?.trim()
        || generateSecureCustomerPortalSlug(state.customers.map((customer) => customer.customerCode)),
      name: customerDraft.name.trim(),
      email: customerDraft.email.trim(),
      phone: customerDraft.phone.trim(),
      address: customerDraft.address.trim(),
      discountEnabled: customerDraft.discountEnabled ?? false,
      discountCode: customerDraft.discountCode?.trim() ?? '',
    }

    let nextState = editingCustomerId
      ? updatePortalCustomer({ ...nextCustomer, id: editingCustomerId })
      : createPortalCustomer(nextCustomer)

    if (editingCustomerId) {
      const customerVehicle = {
        ...vehicleDraft,
        customerId: editingCustomerId,
        id: vehicleDraft.id || `veh-${Math.random().toString(36).slice(2, 8)}`,
      }
      nextState = updatePortalVehicle(customerVehicle)
    }

    setState(nextState)
    setCustomerDraft(makeCustomerDraft())
    setVehicleDraft(makeVehicleDraft())
    setGalleryDraft(makeGalleryDraft())
    setServiceDraft({
      title: '',
      completedOn: new Date().toISOString().slice(0, 10),
      vehicle: '',
      notes: '',
      servicePreset: 'Ambient Lighting',
      warrantyNumber: '',
      warrantyStartsOn: new Date().toISOString().slice(0, 10),
      warrantyEndsOn: new Date().toISOString().slice(0, 10),
      warrantyCoverage: '',
      warrantyNotes: '',
    })
    setEditingCustomerId(null)
  }

  const updateDraftService = (serviceId: string, updates: Partial<PublicServiceContent>) => {
    const nextServiceId = updates.id?.trim()
    setWebsiteContentDraft((current) => ({
      ...current,
      services: current.services.map((service) => (service.id === serviceId ? { ...service, ...updates, id: nextServiceId || service.id } : service)),
    }))

    if (nextServiceId && nextServiceId !== serviceId) {
      setSelectedServiceDraftId(nextServiceId)
    }
  }

  const updateSelectedProjectDraft = (updates: Partial<PublicProjectContent>) => {
    if (!selectedProjectDraftId) {
      return
    }

    const nextProjectId = updates.id?.trim()
    setWebsiteContentDraft((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === selectedProjectDraftId ? { ...project, ...updates } : project)),
    }))

    if (nextProjectId && nextProjectId !== selectedProjectDraftId) {
      setSelectedProjectDraftId(nextProjectId)
    }
  }

  const addWebsiteService = () => {
    const nextIndex = websiteContentDraft.services.length + 1
    const id = `service-${Date.now()}`
    setWebsiteContentDraft((current) => ({
      ...current,
      services: [
        ...current.services,
        { id, number: String(nextIndex).padStart(2, '0'), title: 'New Service', description: '', image: '/images/ambient-light.webp' },
      ],
    }))
    setSelectedServiceDraftId(id)
  }

  const removeWebsiteService = (serviceId: string) => {
    const nextServices = websiteContentDraft.services.filter((service) => service.id !== serviceId)
    const nextProjects = websiteContentDraft.projects.filter((project) => project.serviceId !== serviceId)

    setWebsiteContentDraft((current) => ({
      ...current,
      services: nextServices,
      projects: nextProjects,
    }))

    if (selectedServiceDraftId === serviceId) {
      setSelectedServiceDraftId(nextServices[0]?.id ?? '')
    }
  }

  const addWebsiteProject = () => {
    const firstServiceId = websiteContentDraft.services[0]?.id ?? 'ambient-lighting'
    const newProjectId = `project-${Date.now()}`
    setWebsiteContentDraft((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: newProjectId,
          serviceId: firstServiceId,
          brand: 'Brand',
          model: 'Model',
          title: 'New project title',
          image: '/images/ambient-light.webp',
        },
      ],
    }))
    setSelectedProjectDraftId(newProjectId)
  }

  const removeWebsiteProject = (projectId: string) => {
    const nextProjects = websiteContentDraft.projects.filter((project) => project.id !== projectId)
    setWebsiteContentDraft((current) => ({
      ...current,
      projects: nextProjects,
    }))
    if (selectedProjectDraftId === projectId) {
      setSelectedProjectDraftId(nextProjects[0]?.id ?? '')
    }
  }

  const addWebsiteBrand = () => {
    const brand = newBrandName.trim()
    if (!brand) {
      return
    }

    setWebsiteContentDraft((current) => ({
      ...current,
      vehicleBrandModels: {
        ...current.vehicleBrandModels,
        [brand]: newBrandFirstModel.trim() ? [newBrandFirstModel.trim()] : ['Other'],
      },
    }))
    setSelectedBrandDraftName(brand)
    setSelectedModelDraftName(newBrandFirstModel.trim() || 'Other')
    setNewBrandName('')
    setNewBrandFirstModel('')
  }

  const removeWebsiteBrand = (brand: string) => {
    setWebsiteContentDraft((current) => {
      const nextVehicleBrandModels = { ...current.vehicleBrandModels }
      delete nextVehicleBrandModels[brand]
      return {
        ...current,
        vehicleBrandModels: nextVehicleBrandModels,
      }
    })
  }

  const renameWebsiteBrand = (currentBrand: string, nextBrandValue: string) => {
    const nextBrand = nextBrandValue.trim()
    if (!nextBrand || nextBrand === currentBrand) {
      return
    }

    setWebsiteContentDraft((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.brand === currentBrand ? { ...project, brand: nextBrand } : project)),
      vehicleBrandModels: Object.fromEntries(
        Object.entries(current.vehicleBrandModels).map(([brand, models]) => (brand === currentBrand ? [nextBrand, models] : [brand, models])),
      ),
    }))
    setSelectedBrandDraftName(nextBrand)
  }

  const addBrandModel = () => {
    const model = newModelName.trim()
    if (!selectedBrandDraftName || !model) {
      return
    }

    setWebsiteContentDraft((current) => {
      const currentModels = current.vehicleBrandModels[selectedBrandDraftName] ?? []
      if (currentModels.includes(model)) {
        return current
      }

      return {
        ...current,
        vehicleBrandModels: {
          ...current.vehicleBrandModels,
          [selectedBrandDraftName]: [...currentModels, model],
        },
      }
    })
    setSelectedModelDraftName(model)
    setNewModelName('')
  }

  const renameBrandModel = (brand: string, model: string, nextModelValue: string) => {
    const nextModel = nextModelValue.trim()
    if (!nextModel || nextModel === model) {
      return
    }

    setWebsiteContentDraft((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.brand === brand && project.model === model ? { ...project, model: nextModel } : project)),
      vehicleBrandModels: {
        ...current.vehicleBrandModels,
        [brand]: (current.vehicleBrandModels[brand] ?? []).map((entry) => (entry === model ? nextModel : entry)),
      },
    }))
    setSelectedModelDraftName(nextModel)
  }

  const removeBrandModel = (brand: string, model: string) => {
    setWebsiteContentDraft((current) => {
      const nextModels = (current.vehicleBrandModels[brand] ?? []).filter((entry) => entry !== model)
      const safeModels = nextModels.length ? nextModels : ['Other']
      return {
        ...current,
        vehicleBrandModels: {
          ...current.vehicleBrandModels,
          [brand]: safeModels,
        },
      }
    })
  }

  const saveWebsiteContent = () => {
    const sanitized: WebsiteContent = {
      contentVersion: WEBSITE_CONTENT_VERSION,
      heroImage: websiteContentDraft.heroImage.trim() || DEFAULT_WEBSITE_CONTENT.heroImage,
      services: websiteContentDraft.services
        .map((service, index) => ({
          ...service,
          id: service.id.trim() || `service-${index + 1}`,
          number: service.number.trim() || String(index + 1).padStart(2, '0'),
          title: service.title.trim() || `Service ${index + 1}`,
          description: service.description.trim(),
          image: service.image.trim() || DEFAULT_WEBSITE_CONTENT.heroImage,
        })),
      projects: websiteContentDraft.projects
        .map((project, index) => ({
          ...project,
          id: project.id.trim() || `project-${index + 1}`,
          serviceId: project.serviceId.trim() || websiteContentDraft.services[0]?.id || 'ambient-lighting',
          brand: project.brand.trim() || 'Brand',
          model: project.model.trim() || 'Model',
          title: project.title.trim() || `Project ${index + 1}`,
          image: project.image.trim() || DEFAULT_WEBSITE_CONTENT.heroImage,
        })),
      vehicleBrandModels: Object.fromEntries(
        Object.entries(websiteContentDraft.vehicleBrandModels).map(([brand, models]) => [
          brand.trim(),
          models.map((model) => model.trim()).filter(Boolean),
        ]).filter(([brand, models]) => Boolean(brand) && models.length),
      ),
    }

    const nextState = updatePortalWebsiteContent(sanitized)
    setState(nextState)
    setWebsiteContentDraft(deepCloneWebsiteContent(sanitized))
  }

  const saveGalleryItem = () => {
    const trimmedTitle = galleryDraft.title.trim()
    const trimmedDescription = galleryDraft.description.trim()
    const selectedImages = pendingGalleryImages.length ? pendingGalleryImages : (galleryDraft.imageUrl.trim() ? [galleryDraft.imageUrl.trim()] : [])

    if (!selectedImages.length) {
      return
    }

    const fallbackTitle = trimmedTitle || `Customer photo ${new Date().toISOString().slice(0, 10)}`

    let nextState = state
    selectedImages.forEach((imageUrl, index) => {
      nextState = updatePortalGallery({
        ...galleryDraft,
        id: `${galleryDraft.id}-${Date.now()}-${index}`,
        title: fallbackTitle,
        description: trimmedDescription || 'Customer photo',
        imageUrl,
        category: galleryDraft.category || 'customer',
        featured: galleryDraft.featured ?? false,
        customerId: editingCustomerId ?? galleryDraft.customerId,
      }, nextState)
    })

    setState(nextState)
    setPendingGalleryImages([])
    setGalleryDraft(makeGalleryDraft(editingCustomerId ?? undefined))
  }

  const removeGalleryItem = (itemId: string) => {
    setState((current) => removePortalGalleryItem(itemId, current))
  }

  const removeCustomer = (customerId: string) => {
    const nextState = deletePortalCustomer(customerId)
    setState(nextState)
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      return
    }

    Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
      reader.readAsDataURL(file)
    }))).then((dataUrls) => {
      setPendingGalleryImages((current) => [...current, ...dataUrls])
      setGalleryDraft((current) => ({ ...current, imageUrl: dataUrls[0] ?? current.imageUrl }))
    }).catch(() => {
      setPendingGalleryImages((current) => current)
    })
  }

  if (adminAccess !== 'authorized') {
    return (
      <main className="portal-page">
        <div className="shell portal-landing">
          <section className="portal-body-card portal-landing-card">
            <div className="portal-card">
              <p className="portal-eyebrow">Secure admin access</p>
              <h1>{adminAccess === 'checking' ? 'Checking your session…' : 'Redirecting to login…'}</h1>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <PortalShell active="admin" title="Admin Dashboard" subtitle="Operate Glowworks Lab from one premium control center.">
      <div className="portal-grid portal-grid-two">
        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Operations overview</h3>
            <div className="portal-chip"><ShieldCheck size={15} /> Secure</div>
          </div>
          <div className="portal-stat-row">
            <div className="portal-stat">
              <strong>{state.customers.length}</strong>
              <span>Total Customers</span>
            </div>
            <div className="portal-stat">
              <strong>{state.warranties.filter((item) => item.status === 'Active').length}</strong>
              <span>Active Warranties</span>
            </div>
            <div className="portal-stat">
              <strong>{state.warranties.filter((item) => item.status === 'Expired').length}</strong>
              <span>Expired Warranties</span>
            </div>
          </div>
        </div>

      </div>

      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Search customers</h3>
          <div className="portal-chip"><Search size={15} /> Live</div>
        </div>
        <label className="full" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>Search by customer name, phone, plate, customer ID or vehicle</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Nikos, RO-4821, GWL-000001" />
        </label>
        <div className="portal-list" style={{ marginTop: '16px' }}>
          {filteredCustomers.map((customer) => (
            <div className="portal-row portal-row-with-actions" key={customer.id} role="button" tabIndex={0} onClick={() => openCustomerProfile(customer)} onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openCustomerProfile(customer)
              }
            }} style={{ cursor: 'pointer' }}>
              <div className="portal-row-copy">
                <strong>{customer.name}</strong>
                <p>{customer.email} • {customer.phone}</p>
                <div className="portal-link-inline">
                  <span className="portal-chip">NFC / QR ready</span>
                  <code className="portal-link-code">{buildCustomerPortalUrl(customer.customerCode, { kind: 'nfc' })}</code>
                </div>
              </div>
              <div className="portal-row-meta">
                <div className="portal-chip">{customer.customerCode}</div>
                <button className="button button-secondary portal-inline-button" type="button" onClick={(event) => {
                  event.stopPropagation()
                  void copyCustomerPortalLink(customer)
                }}>
                  <Copy size={14} /> {copiedCustomerId === customer.id ? 'Copied' : 'Copy NFC URL'}
                </button>
                <button className="button button-secondary portal-inline-button" type="button" onClick={(event) => {
                  event.stopPropagation()
                  openCustomerProfile(customer)
                }}>
                  Open profile
                </button>
                <button className="button button-primary portal-inline-button" type="button" onClick={(event) => {
                  event.stopPropagation()
                  startEditingCustomer(customer)
                }}>
                  Edit
                </button>
                <p>{customer.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Create / edit customer</h3>
          <div className="portal-chip"><UserPlus size={15} /> CRM</div>
        </div>

        <div className="portal-grid portal-grid-two">
          <div>
            <form className="form-grid">
              <label>
                <span>Name</span>
                <input value={customerDraft.name} onChange={(event) => setCustomerDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Customer name" />
              </label>
              <label>
                <span>Email</span>
                <input value={customerDraft.email} onChange={(event) => setCustomerDraft((current) => ({ ...current, email: event.target.value }))} placeholder="email@example.com" />
              </label>
              <label>
                <span>Phone</span>
                <input value={customerDraft.phone} onChange={(event) => setCustomerDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
              </label>
              <label className="full">
                <span>Address</span>
                <input value={customerDraft.address} onChange={(event) => setCustomerDraft((current) => ({ ...current, address: event.target.value }))} placeholder="Address" />
              </label>
              <label>
                <span>Discount enabled</span>
                <select value={customerDraft.discountEnabled ? 'true' : 'false'} onChange={(event) => setCustomerDraft((current) => ({ ...current, discountEnabled: event.target.value === 'true' }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="full">
                <span>Discount code</span>
                <input value={customerDraft.discountCode ?? ''} onChange={(event) => setCustomerDraft((current) => ({ ...current, discountCode: event.target.value }))} placeholder="GLOW10" />
              </label>
              <div className="portal-actions" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                <button className="button button-primary" type="button" onClick={saveCustomer}>{editingCustomerId ? 'Save customer' : 'Create customer'}</button>
                {editingCustomerId ? <button className="button button-secondary" type="button" onClick={cancelCustomerEdit}>Cancel</button> : null}
              </div>
            </form>
          </div>

          <div>
            <div className="form-grid">
              <label>
                <span>Vehicle make</span>
                <SearchableSelect
                  value={vehicleDraft.make}
                  onSelect={(brand) => setVehicleDraft((current) => ({ ...current, make: brand, model: '' }))}
                  options={vehicleBrandOptions}
                  placeholder="Mercedes-Benz"
                  emptyText="No matching brand"
                />
              </label>
              <label>
                <span>Vehicle model</span>
                <SearchableSelect
                  value={vehicleDraft.model}
                  onSelect={(model) => setVehicleDraft((current) => ({ ...current, model }))}
                  options={selectedVehicleModels}
                  placeholder="A-Class"
                  emptyText="No matching model for this brand"
                />
              </label>
              <label>
                <span>Year</span>
                <input type="number" value={vehicleDraft.year} onChange={(event) => setVehicleDraft((current) => ({ ...current, year: Number(event.target.value) }))} />
              </label>
              <label>
                <span>Plate</span>
                <input value={vehicleDraft.plate} onChange={(event) => setVehicleDraft((current) => ({ ...current, plate: event.target.value }))} placeholder="RO-4821" />
              </label>
              <label>
                <span>VIN</span>
                <input value={vehicleDraft.vin} onChange={(event) => setVehicleDraft((current) => ({ ...current, vin: event.target.value }))} placeholder="WDB123..." />
              </label>
              <label>
                <span>NFC tag</span>
                <input value={vehicleDraft.nfcTagId ?? ''} onChange={(event) => setVehicleDraft((current) => ({ ...current, nfcTagId: event.target.value }))} placeholder="NFC-001" />
              </label>
              <label>
                <span>Purchase date</span>
                <input type="date" value={vehicleDraft.purchaseDate} onChange={(event) => setVehicleDraft((current) => ({ ...current, purchaseDate: event.target.value }))} />
              </label>
            </div>
          </div>
        </div>

        <div className="portal-card" style={{ marginTop: '16px', border: '1px solid rgba(76, 211, 209, 0.18)', padding: '16px' }}>
          <div className="portal-card-title-row">
            <h3>Add service entry</h3>
            <div className="portal-chip">Admin only</div>
          </div>
          <p className="portal-muted" style={{ marginBottom: '12px' }}>Select a customer from the list, then add a completed service here and it will appear on that profile immediately.</p>
          <div className="form-grid">
            <label>
              <span>Service preset</span>
              <SearchableSelect
                value={serviceDraft.servicePreset}
                onSelect={(service) => setServiceDraft((current) => ({
                  ...current,
                  servicePreset: service,
                  title: service === 'Custom' ? current.title : service,
                }))}
                options={['Custom', ...SERVICE_PRESET_OPTIONS]}
                placeholder="Ambient Lighting"
                emptyText="No matching service"
              />
            </label>
            <label>
              <span>Completed on</span>
              <input type="date" value={serviceDraft.completedOn} onChange={(event) => setServiceDraft((current) => ({ ...current, completedOn: event.target.value }))} />
            </label>
            <label className="full">
              <span>Service title</span>
              <input value={serviceDraft.title} onChange={(event) => setServiceDraft((current) => ({ ...current, title: event.target.value, servicePreset: 'Custom' }))} placeholder="Ambient lighting or custom title" />
            </label>
            <label className="full">
              <span>Vehicle</span>
              <input value={serviceDraft.vehicle} onChange={(event) => setServiceDraft((current) => ({ ...current, vehicle: event.target.value }))} placeholder="Mercedes A-Class" />
            </label>
            <label className="full">
              <span>Notes</span>
              <textarea value={serviceDraft.notes} onChange={(event) => setServiceDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Installation completed in studio" />
            </label>
            <label>
              <span>Warranty number</span>
              <input value={serviceDraft.warrantyNumber} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyNumber: event.target.value }))} placeholder="W-SVC-001" />
            </label>
            <label>
              <span>Warranty starts</span>
              <input type="date" value={serviceDraft.warrantyStartsOn} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyStartsOn: event.target.value }))} />
            </label>
            <label>
              <span>Warranty ends</span>
              <input type="date" value={serviceDraft.warrantyEndsOn} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyEndsOn: event.target.value }))} />
            </label>
            <label className="full">
              <span>Warranty coverage</span>
              <input value={serviceDraft.warrantyCoverage} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyCoverage: event.target.value }))} placeholder="2 years · workmanship + support" />
            </label>
            <label className="full">
              <span>Warranty notes</span>
              <textarea value={serviceDraft.warrantyNotes} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyNotes: event.target.value }))} placeholder="Warranty details for this service" />
            </label>
            <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="button button-primary" type="button" onClick={handleSaveServiceHistory} disabled={!(selectedCustomerId || editingCustomerId)}>
                {editingServiceEntryId ? 'Save service changes' : 'Add service to profile'}
              </button>
              {editingServiceEntryId ? (
                <button className="button button-secondary" type="button" onClick={resetServiceDraft}>Cancel edit</button>
              ) : null}
            </div>
          </div>

          {(selectedCustomerId || editingCustomerId) ? (
            <div style={{ marginTop: '16px' }}>
              <div className="portal-card-title-row" style={{ marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Manage services for this customer</h4>
                <div className="portal-chip">Admin edit</div>
              </div>
              {currentCustomerServices.length ? (
                <div className="portal-list">
                  {currentCustomerServices.map((entry) => (
                    <div className="portal-row portal-row-with-actions" key={entry.id}>
                      <div>
                        <strong>{entry.title}</strong>
                        <p>{entry.completedOn} • {entry.vehicle || 'Vehicle'}</p>
                        {(() => {
                          const serviceWarranty = state.warranties.find((warranty) => warranty.id === entry.warrantyId)
                          if (!serviceWarranty) {
                            return null
                          }

                          return (
                            <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem' }}>
                              Warranty: {serviceWarranty.warrantyNumber ?? 'Service warranty'} • {serviceWarranty.status} • Ends {serviceWarranty.endsOn}
                            </p>
                          )
                        })()}
                      </div>
                      <div className="portal-actions" style={{ gap: '8px' }}>
                        <button className="portal-ghost-button" type="button" onClick={() => startEditingService(entry)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="portal-ghost-button" type="button" onClick={() => handleRemoveServiceHistory(entry.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="portal-muted">No services recorded yet for this customer.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="form-grid" style={{ marginTop: '16px' }}>
          <label className="full">
            <span>Profile photos</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
            <p className="portal-muted" style={{ marginTop: '6px' }}>You can select several images at once and save them as separate gallery items.</p>
          </label>
          <label className="full">
            <span>Image URL or data URL</span>
            <textarea value={galleryDraft.imageUrl} onChange={(event) => setGalleryDraft((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="/images/your-photo.jpg or a data URL" />
          </label>
          {pendingGalleryImages.length ? (
            <div className="full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {pendingGalleryImages.map((imageUrl, index) => (
                <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`Selected photo ${index + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(76, 211, 209, 0.25)' }} />
              ))}
            </div>
          ) : galleryDraft.imageUrl ? (
            <div className="full">
              <img src={galleryDraft.imageUrl} alt="Selected photo preview" style={{ maxWidth: '220px', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(76, 211, 209, 0.25)' }} />
            </div>
          ) : null}
          <label className="full">
            <span>Photo title</span>
            <input value={galleryDraft.title} onChange={(event) => setGalleryDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ambient lighting install" />
          </label>
          <label className="full">
            <span>Photo description</span>
            <textarea value={galleryDraft.description} onChange={(event) => setGalleryDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Customer photo and installation detail" />
          </label>
          <button className="button button-secondary" type="button" onClick={saveGalleryItem}>Save customer photo</button>
        </div>

        <div className="portal-card" style={{ marginTop: '16px', border: '1px solid rgba(76, 211, 209, 0.18)', padding: '16px' }}>
          <div className="portal-card-title-row" style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem' }}>Manage customer photos</h4>
            <div className="portal-chip">Admin delete</div>
          </div>
          {state.gallery.filter((item) => item.customerId === (editingCustomerId ?? selectedCustomerId ?? undefined)).length ? (
            <div className="portal-list">
              {state.gallery.filter((item) => item.customerId === (editingCustomerId ?? selectedCustomerId ?? undefined)).map((item) => (
                <div className="portal-row portal-row-with-actions" key={item.id}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title || 'Customer photo'} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(76, 211, 209, 0.25)' }} />
                    ) : null}
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description || 'Customer photo'}</p>
                    </div>
                  </div>
                  <button className="portal-ghost-button" type="button" onClick={() => removeGalleryItem(item.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="portal-muted">No customer photos saved yet.</p>
          )}
        </div>

        <div className="portal-list" style={{ marginTop: '16px' }}>
          {state.customers.map((customer) => (
            <div
              className={`portal-row${selectedCustomerId === customer.id ? ' active' : ''}`}
              key={customer.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCustomerId(customer.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedCustomerId(customer.id)
                }
              }}
            >
              <div>
                <strong>{customer.name}</strong>
                <p>{customer.customerCode}</p>
              </div>
              <div className="portal-row-meta">
                <button className="portal-ghost-button" type="button" onClick={() => startEditingCustomer(customer)}>
                  <PencilLine size={14} /> Edit
                </button>
                <button className="portal-ghost-button" type="button" onClick={() => removeCustomer(customer.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-card" style={{ marginTop: '16px' }}>
        <div className="portal-card-title-row">
          <h3>Website content manager</h3>
          <div className="portal-chip">Admin only</div>
        </div>
        <p className="portal-muted" style={{ marginBottom: '12px' }}>
          Edit homepage images, project gallery entries, and available brand/model options used in booking forms.
        </p>

        <div className="form-grid">
          <label className="full">
            <span>Hero image path</span>
            <input
              value={websiteContentDraft.heroImage}
              onChange={(event) => setWebsiteContentDraft((current) => ({ ...current, heroImage: event.target.value }))}
              placeholder="/images/ambient-light.webp"
            />
          </label>
        </div>

        <div className="portal-card" style={{ marginTop: '14px', border: '1px solid rgba(76, 211, 209, 0.18)', padding: '14px' }}>
          <div className="portal-card-title-row" style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem' }}>Services</h4>
            <button className="button button-secondary" type="button" onClick={addWebsiteService}>Add service</button>
          </div>
          {serviceSelectorOptions.length ? (
            <div className="form-grid">
              <label className="full">
                <span>Select service</span>
                <SearchableSelect
                  value={selectedServiceSelectorValue}
                  onSelect={(selectedLabel) => {
                    const selectedService = serviceSelectorOptions.find((service) => service.label === selectedLabel)
                    if (selectedService) {
                      setSelectedServiceDraftId(selectedService.id)
                    }
                  }}
                  options={serviceSelectorOptions.map((service) => service.label)}
                  placeholder="Ambient Lighting (ambient-lighting)"
                  emptyText="No matching service"
                />
              </label>
              {selectedServiceDraft ? (
                <>
                  <label>
                    <span>Service ID</span>
                    <input value={selectedServiceDraft.id} onChange={(event) => updateDraftService(selectedServiceDraft.id, { id: event.target.value })} />
                  </label>
                  <label>
                    <span>Number</span>
                    <input value={selectedServiceDraft.number} onChange={(event) => updateDraftService(selectedServiceDraft.id, { number: event.target.value })} />
                  </label>
                  <label className="full">
                    <span>Title</span>
                    <input value={selectedServiceDraft.title} onChange={(event) => updateDraftService(selectedServiceDraft.id, { title: event.target.value })} />
                  </label>
                  <label className="full">
                    <span>Description</span>
                    <textarea value={selectedServiceDraft.description} onChange={(event) => updateDraftService(selectedServiceDraft.id, { description: event.target.value })} />
                  </label>
                  <label className="full">
                    <span>Image path</span>
                    <input value={selectedServiceDraft.image} onChange={(event) => updateDraftService(selectedServiceDraft.id, { image: event.target.value })} />
                  </label>
                  <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="portal-ghost-button" type="button" onClick={() => removeWebsiteService(selectedServiceDraft.id)}>
                      <Trash2 size={14} /> Remove selected service
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="portal-muted">No services yet. Click “Add service”.</p>
          )}
        </div>

        <div className="portal-card" style={{ marginTop: '14px', border: '1px solid rgba(76, 211, 209, 0.18)', padding: '14px' }}>
          <div className="portal-card-title-row" style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem' }}>Projects</h4>
            <button className="button button-secondary" type="button" onClick={addWebsiteProject}>Add project</button>
          </div>
          {projectSelectorOptions.length ? (
            <div className="form-grid">
              <label className="full">
                <span>Select project name</span>
                <SearchableSelect
                  value={selectedProjectSelectorValue}
                  onSelect={(selectedLabel) => {
                    const selectedProject = projectSelectorOptions.find((project) => project.label === selectedLabel)
                    if (selectedProject) {
                      setSelectedProjectDraftId(selectedProject.id)
                    }
                  }}
                  options={projectSelectorOptions.map((project) => project.label)}
                  placeholder="Ambient Lighting • Mercedes A-Class W177"
                  emptyText="No matching project name"
                />
              </label>
              {selectedProjectDraft ? (
                <>
                  <label>
                    <span>Project ID</span>
                    <input value={selectedProjectDraft.id} onChange={(event) => updateSelectedProjectDraft({ id: event.target.value })} />
                  </label>
                  <label>
                    <span>Service ID</span>
                    <SearchableSelect
                      value={serviceSelectorOptions.find((service) => service.id === selectedProjectDraft.serviceId)?.label ?? selectedProjectDraft.serviceId}
                      onSelect={(selectedLabel) => {
                        const selectedService = serviceSelectorOptions.find((service) => service.label === selectedLabel)
                        if (selectedService) {
                          updateSelectedProjectDraft({ serviceId: selectedService.id })
                        }
                      }}
                      options={serviceSelectorOptions.map((service) => service.label)}
                      placeholder="Ambient Light (ambient-lighting)"
                      emptyText="No matching service"
                    />
                  </label>
                  <label>
                    <span>Brand</span>
                    <SearchableSelect
                      value={selectedProjectDraft.brand}
                      onSelect={(brand) => updateSelectedProjectDraft({ brand, model: '' })}
                      options={brandSelectorOptions}
                      placeholder="Mercedes-Benz"
                      emptyText="No matching brand"
                    />
                  </label>
                  <label>
                    <span>Model</span>
                    <SearchableSelect
                      value={selectedProjectDraft.model}
                      onSelect={(model) => updateSelectedProjectDraft({ model })}
                      options={websiteContentDraft.vehicleBrandModels[selectedProjectDraft.brand] ?? []}
                      placeholder="A-Class W177"
                      emptyText="No matching model"
                    />
                  </label>
                  <label className="full">
                    <span>Title</span>
                    <input value={selectedProjectDraft.title} onChange={(event) => updateSelectedProjectDraft({ title: event.target.value })} />
                  </label>
                  <label className="full">
                    <span>Image path</span>
                    <input value={selectedProjectDraft.image} onChange={(event) => updateSelectedProjectDraft({ image: event.target.value })} />
                  </label>
                  <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="portal-ghost-button" type="button" onClick={() => removeWebsiteProject(selectedProjectDraft.id)}>
                      <Trash2 size={14} /> Remove selected project
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="portal-muted">No projects yet. Click “Add project”.</p>
          )}
        </div>

        <div className="portal-card" style={{ marginTop: '14px', border: '1px solid rgba(76, 211, 209, 0.18)', padding: '14px' }}>
          <div className="portal-card-title-row" style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem' }}>Brand / model catalog</h4>
            <div className="portal-chip">Used in booking dropdowns</div>
          </div>
          <div className="form-grid">
            <label>
              <span>New brand</span>
              <input value={newBrandName} onChange={(event) => setNewBrandName(event.target.value)} placeholder="Lamborghini" />
            </label>
            <label>
              <span>First model (optional)</span>
              <input value={newBrandFirstModel} onChange={(event) => setNewBrandFirstModel(event.target.value)} placeholder="Huracan" />
            </label>
            <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="button button-secondary" type="button" onClick={addWebsiteBrand}>Add brand</button>
            </div>
          </div>
          {brandSelectorOptions.length ? (
            <div className="form-grid" style={{ marginTop: '12px' }}>
              <label className="full">
                <span>Select brand</span>
                <SearchableSelect
                  value={selectedBrandDraftName}
                  onSelect={setSelectedBrandDraftName}
                  options={brandSelectorOptions}
                  placeholder="Mercedes-Benz"
                  emptyText="No matching brand"
                />
              </label>

              {selectedBrandDraftName ? (
                <>
                  <label className="full">
                    <span>Brand name</span>
                    <input
                      value={selectedBrandDraftName}
                      onChange={(event) => renameWebsiteBrand(selectedBrandDraftName, event.target.value)}
                    />
                  </label>
                  <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="portal-ghost-button" type="button" onClick={() => removeWebsiteBrand(selectedBrandDraftName)}>
                      <Trash2 size={14} /> Remove selected brand
                    </button>
                  </div>

                  <label className="full">
                    <span>Select model</span>
                    <SearchableSelect
                      value={selectedModelDraftName}
                      onSelect={setSelectedModelDraftName}
                      options={selectedBrandModels}
                      placeholder="A-Class"
                      emptyText="No matching model"
                    />
                  </label>
                  {selectedModelDraftName ? (
                    <>
                      <label className="full">
                        <span>Model name</span>
                        <input
                          value={selectedModelDraftName}
                          onChange={(event) => renameBrandModel(selectedBrandDraftName, selectedModelDraftName, event.target.value)}
                        />
                      </label>
                      <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
                        <button className="portal-ghost-button" type="button" onClick={() => removeBrandModel(selectedBrandDraftName, selectedModelDraftName)}>
                          <Trash2 size={14} /> Remove selected model
                        </button>
                      </div>
                    </>
                  ) : null}

                  <label className="full">
                    <span>Add new model</span>
                    <input value={newModelName} onChange={(event) => setNewModelName(event.target.value)} placeholder="GLC Coupe" />
                  </label>
                  <div className="portal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="button button-secondary" type="button" onClick={addBrandModel}>Add model</button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="portal-muted" style={{ marginTop: '12px' }}>No brands yet. Add a brand first.</p>
          )}
        </div>

        <div className="portal-actions" style={{ marginTop: '12px', justifyContent: 'flex-start' }}>
          <button className="button button-primary" type="button" onClick={saveWebsiteContent}>
            Save website content
          </button>
        </div>
      </div>

      <div className="portal-card" style={{ marginTop: '16px' }}>
        <div className="portal-card-title-row">
          <h3>Selected customer workspace</h3>
          <div className="portal-chip"><UserPlus size={15} /> Profile</div>
        </div>
        <p className="portal-muted">Choose a customer from the list above. Once the profile is open, you can add photos and adjust discount settings directly from that customer profile screen.</p>
      </div>
    </PortalShell>
  )
}
