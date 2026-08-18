import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Copy, ExternalLink, Link2, Mail, MapPin, PencilLine, Phone, Search, ShieldCheck, Trash2, UserPlus, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PortalShell } from '../../components/portal/PortalShell'
import { buildCustomerPortalUrl, generateSecureCustomerPortalSlug } from '../../lib/customer-links'
import { hasValidAdminSession } from '../../lib/portal-auth'
import {
  deleteCustomerGalleryItem,
  fetchCustomerGallery,
  saveCustomerGalleryItem,
} from '../../lib/customer-gallery'
import {
  createProject,
  deleteProject,
  deleteProjectMedia,
  fetchProjects,
  setProjectCover,
  updateProject,
  uploadProjectImages,
} from '../../lib/projects'
import type { ProjectDraft, ProjectMedia, ProjectRecord } from '../../types/projects'
import {
  fetchHomepageImages,
  uploadHomepageImage,
  type HomepageImageRecord,
  type HomepageImageSlot,
} from '../../lib/homepage-images'
import { addPortalServiceHistoryEntry, getPortalState, createPortalCustomer, deletePortalCustomer, hydratePortalStateFromSupabase, removePortalGalleryItem, removePortalServiceHistoryEntry, updatePortalCustomer, updatePortalGallery, updatePortalServiceHistoryEntry, updatePortalVehicle } from '../../lib/portal-session'
import type { AdminGalleryItem, CustomerProfile, PortalState, ServiceHistoryEntry, VehicleRecord, WarrantyRecord } from '../../types/portal'
import { createInitialPortalState } from '../../lib/portal-data'

export const Route = createFileRoute('/portal/admin')({
  component: AdminPage,
})

const DEFAULT_WARRANTY_TERMS = `Η εγγύηση καλύπτει την εγκατάσταση και τη λειτουργία του προϊόντος για τη συμφωνημένη διάρκεια. Η κάλυψη περιλαμβάνει επισκευή ή αντικατάσταση σε περίπτωση βλάβης που οφείλεται σε ελαττωματικό υλικό ή εργασία. Δεν καλύπτονται φθορές από κακή χρήση, μηχανική βλάβη, μη εξουσιοδοτημένες τροποποιήσεις ή ζημιές από φυσική καταστροφή.`

const SERVICE_PRESET_OPTIONS = ['Ambient Lighting', 'Starlight Headliner', 'Alcantara Interior', 'Carbon Trim', 'Premium Audio', 'Sunroof', 'Seat Upgrade', 'Interior Mood Lighting', 'Custom Trim', 'Other']

const VEHICLE_BRAND_MODELS: Record<string, string[]> = {
  'Audi': ['A1 8X', 'A1 GB', 'A3 8L', 'A3 8P', 'A3 8V', 'A3 8Y', 'A4 B6', 'A4 B7', 'A4 B8', 'A4 B9', 'A5 8T', 'A5 F5', 'A6 C6', 'A6 C7', 'A6 C8', 'A7 4G', 'A7 4K', 'A8 D3', 'A8 D4', 'A8 D5', 'Q2 GA', 'Q3 8U', 'Q3 F3', 'Q4 e-tron F4', 'Q5 8R', 'Q5 FY', 'Q7 4L', 'Q7 4M', 'Q8 4M8', 'TT 8J', 'TT 8S', 'R8 Type 42', 'R8 Type 4S', 'S3 8V', 'S3 8Y', 'S4 B9', 'S5 F5', 'RS3 8V', 'RS3 8Y', 'RS4 B9', 'RS5 F5', 'RS6 C7', 'RS6 C8', 'RS7 4K', 'e-tron GE', 'e-tron GT FW'],
  'BMW': ['1 Series E81/E82/E87/E88', '1 Series F20/F21', '1 Series F40', '1 Series F70', '2 Series F22/F23', '2 Series F44', '2 Series G42', '3 Series E46', '3 Series E90/E91/E92/E93', '3 Series F30/F31/F34', '3 Series G20/G21', '4 Series F32/F33/F36', '4 Series G22/G23/G26', '5 Series E60/E61', '5 Series F10/F11', '5 Series G30/G31', '5 Series G60/G61', '6 Series E63/E64', '6 Series F12/F13/F06', '7 Series F01/F02', '7 Series G11/G12', '7 Series G70', '8 Series G14/G15/G16', 'X1 E84', 'X1 F48', 'X1 U11', 'X2 F39', 'X2 U10', 'X3 F25', 'X3 G01', 'X3 G45', 'X4 F26', 'X4 G02', 'X5 E70', 'X5 F15', 'X5 G05', 'X6 E71', 'X6 F16', 'X6 G06', 'X7 G07', 'M2 F87', 'M2 G87', 'M3 E46', 'M3 E90/E92/E93', 'M3 F80', 'M3 G80/G81', 'M4 F82/F83', 'M4 G82/G83', 'M5 F10', 'M5 F90', 'M5 G90/G99', 'i3 I01', 'i4 G26', 'i5 G60', 'i7 G70', 'i8 I12/I15', 'iX I20'],
  'Mercedes-Benz': ['A-Class W169', 'A-Class W176', 'A-Class W177', 'B-Class W245', 'B-Class W246', 'B-Class W247', 'C-Class W203', 'C-Class W204', 'C-Class W205', 'C-Class W206', 'C-Class Coupe C204', 'C-Class Coupe C205', 'CLA C117', 'CLA C118', 'CLS C218', 'CLS C257', 'E-Class W211', 'E-Class W212', 'E-Class W213', 'E-Class W214', 'E-Class Coupe C207', 'E-Class Coupe C238', 'G-Class W463', 'G-Class W465', 'GLA X156', 'GLA H247', 'GLB X247', 'GLC X253', 'GLC Coupe C253', 'GLC X254', 'GLC Coupe C254', 'GLE W166', 'GLE V167', 'GLE Coupe C292', 'GLE Coupe C167', 'GLS X166', 'GLS X167', 'S-Class W221', 'S-Class W222', 'S-Class W223', 'S-Class Coupe C217', 'SL R231', 'SL R232', 'AMG GT C190', 'AMG GT C192', 'V-Class W447', 'Vito W447', 'EQA H243', 'EQB X243', 'EQC N293', 'EQE V295', 'EQS V297'],
  'Volkswagen': ['Golf MK4', 'Golf MK5', 'Golf MK6', 'Golf MK7', 'Golf MK7.5', 'Golf MK8', 'Golf MK8.5', 'Golf GTI MK5', 'Golf GTI MK6', 'Golf GTI MK7', 'Golf GTI MK8', 'Golf R MK6', 'Golf R MK7', 'Golf R MK8', 'Polo 6R', 'Polo 6C', 'Polo AW', 'Passat B6', 'Passat B7', 'Passat B8', 'Passat B9', 'Tiguan 5N', 'Tiguan AD1', 'Tiguan CT1', 'Touareg 7L', 'Touareg 7P', 'Touareg CR', 'T-Roc A1', 'T-Cross C1', 'Taigo CS', 'Arteon 3H', 'Scirocco MK3', 'Caddy 2K', 'Caddy SB', 'Transporter T5', 'Transporter T6', 'Transporter T6.1', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID. Buzz'],
  Porsche: ['911', '718', 'Panthera', 'Cayenne', 'Macan', 'Taycan', 'Boxster', 'Cayman', 'Panth', '918 Spyder'],
  Ford: ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Kuga', 'Explorer', 'F-150', 'Puma', 'Edge', 'Ranger'],
  Toyota: ['Yaris', 'Corolla', 'Auris', 'Camry', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'C-HR', 'Aygo', 'Supra'],
  Honda: ['Civic', 'Accord', 'Jazz', 'CR-V', 'HR-V', 'Pilot', 'Type R', 'NSX', 'City', 'FR-V'],
  Nissan: ['Micra', 'Qashqai', 'Juke', 'Leaf', 'X-Trail', 'GT-R', '350Z', '370Z', 'Altima', 'Primera'],
  Hyundai: ['i10', 'i20', 'i30', 'Elantra', 'Tucson', 'Santa Fe', 'Ioniq', 'Kona', 'Bayon', 'IONIQ 5'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'EV6', 'EV9', 'Niro', 'Carnival', 'Stinger'],
  Mazda: ['2', '3', '5', '6', 'CX-3', 'CX-5', 'CX-30', 'MX-5', 'MX-30', 'CX-60'],
  Subaru: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'BRZ', 'WRX', 'Levorg', 'XV', 'Tribeca'],
  Volvo: ['V40', 'V60', 'V70', 'XC40', 'XC60', 'XC90', 'S60', 'S90', 'V90', 'EX30'],
  Peugeot: ['208', '308', '508', '2008', '3008', '5008', '508 SW', '208 GTI', 'RCZ', 'Traveller'],
  Citroen: ['C1', 'C3', 'C4', 'C5', 'C-Elysee', 'Jumper', 'Cactus', 'Berlingo', 'Spacetourer', 'C6'],
  Opel: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Vectra', 'Zafira', 'Adam', 'Combo'],
  Renault: ['Clio', 'Megane', 'Kadjar', 'Captur', 'Austral', 'Scenic', 'Twingo', 'Laguna', 'Koleos', 'Zoe'],
  Seat: ['Ibiza', 'Leon', 'Ateca', 'Tarraco', 'Arona', 'Alhambra', 'Mii', 'Cordoba', 'Exeo'],
  Skoda: ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Enyaq', 'Rapid', 'Yeti', 'Scala', 'Citigo'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar', 'Freelander', 'Range Rover', 'Discovery Sport'],
  Lexus: ['IS', 'ES', 'GS', 'LS', 'UX', 'NX', 'RX', 'LX', 'RC', 'LC'],
  Maserati: ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'GranCabrio'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Giulietta', '4C', 'Tonale'],
  Mini: ['Cooper', 'Countryman', 'Clubman', 'One', 'Paceman'],
}

const ADDITIONAL_VEHICLE_BRANDS = [
  'Acura',
  'Aston Martin',
  'Bentley',
  'Bugatti',
  'Buick',
  'BYD',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Cupra',
  'Dacia',
  'Dodge',
  'DS Automobiles',
  'Ferrari',
  'Fiat',
  'Genesis',
  'GMC',
  'Infiniti',
  'Isuzu',
  'Jaguar',
  'Jeep',
  'Lamborghini',
  'Lincoln',
  'Lotus',
  'McLaren',
  'Mercedes-Benz',
  'MG',
  'Mitsubishi',
  'Polestar',
  'Ram',
  'Rivian',
  'Rolls-Royce',
  'Saab',
  'Smart',
  'Suzuki',
  'Tesla',
  'Vauxhall',
] as const

const VEHICLE_BRAND_OPTIONS = Array.from(
  new Set([
    ...Object.keys(VEHICLE_BRAND_MODELS),
    ...ADDITIONAL_VEHICLE_BRANDS,
  ]),
).sort()

const makeCustomerDraft = (): CustomerProfile => ({
  id: `cust-${Math.random().toString(36).slice(2, 8)}`,
  customerCode: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  loyaltyTier: 'Standard',
  createdAt: new Date().toISOString().slice(0, 10),
  discountEnabled: true,
  discountCode: 'GLOW10',
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
  allowCustom?: boolean
}

function SearchableSelect({
  value,
  onSelect,
  options,
  placeholder,
  emptyText,
  allowCustom = false,
}: SearchableSelectProps) {
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

  const commitCustomValue = () => {
    const trimmedQuery = query.trim()

    if (!allowCustom || !trimmedQuery) {
      setQuery(value)
      setOpen(false)
      return
    }

    const canonicalOption =
      options.find(
        (option) =>
          option.toLowerCase() === trimmedQuery.toLowerCase(),
      ) ?? trimmedQuery

    commitSelection(canonicalOption)
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
        onBlur={commitCustomValue}
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

const HOMEPAGE_IMAGE_SLOTS: ReadonlyArray<{
  slot: HomepageImageSlot
  label: string
  description: string
  fallbackImage: string
}> = [
  {
    slot: 'hero',
    label: 'Main homepage background',
    description: 'The large image at the top of the homepage.',
    fallbackImage: '/images/homepage-ambient-mercedes.png',
  },
  {
    slot: 'ambient-lighting',
    label: 'Ambient Lighting',
    description: 'Service-card image for Ambient Lighting.',
    fallbackImage: '/images/mercedes_glc_w205_coupe.jpg',
  },
  {
    slot: 'custom-steering',
    label: 'Custom Steering Wheels',
    description: 'Service-card image for Custom Steering Wheels.',
    fallbackImage: '/images/custom-steering.webp',
  },
  {
    slot: 'starlight-headliner',
    label: 'Starlight Headliner',
    description: 'Service-card image for Starlight Headliner.',
    fallbackImage: '/images/starlight-headliner.webp',
  },
  {
    slot: 'android-display',
    label: 'Android Displays',
    description: 'Service-card image for Android Displays.',
    fallbackImage: '/images/android-display.webp',
  },
  {
    slot: 'body-kit',
    label: 'Body Kits',
    description: 'Service-card image for Body Kits.',
    fallbackImage: '/images/IMG_2085.JPEG',
  },
]

function getCustomerBenefitStatus(customer: CustomerProfile, now = new Date()) {
  const expiresAt = customer.discountExpiresAt ? new Date(customer.discountExpiresAt) : null
  const expiresAtTime = expiresAt?.getTime() ?? Number.NaN

  if (!customer.discountEnabled) {
    return { label: 'Disabled', detail: 'Enable the discount to make an active benefit visible.' }
  }

  if (!expiresAt || !Number.isFinite(expiresAtTime)) {
    return { label: 'Not active', detail: 'Starts when a new completed service is added.' }
  }

  if (expiresAtTime <= now.getTime()) {
    return { label: 'EXPIRED', detail: `Expired ${expiresAt.toLocaleDateString('en-GB')}` }
  }

  const daysRemaining = Math.max(1, Math.ceil((expiresAtTime - now.getTime()) / 86_400_000))
  return {
    label: 'ACTIVE',
    detail: `${daysRemaining} days remaining Â· expires ${expiresAt.toLocaleDateString('en-GB')}`,
  }
}
function AdminPage() {
  const [state, setState] = useState<PortalState>(() => createInitialPortalState())
  const [portalHydrated, setPortalHydrated] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerDraft, setCustomerDraft] = useState<CustomerProfile>(makeCustomerDraft)
  const [vehicleDraft, setVehicleDraft] = useState<VehicleRecord>(() => makeVehicleDraft())
  const [, setWarrantyDraft] = useState<WarrantyRecord>(() => makeWarrantyDraft())
  const [galleryDraft, setGalleryDraft] = useState<AdminGalleryItem>(() => makeGalleryDraft())
  const [pendingGalleryImages, setPendingGalleryImages] = useState<string[]>([])
  const [serviceDraft, setServiceDraft] = useState(() => makeServiceDraft())
  const [editingServiceEntryId, setEditingServiceEntryId] = useState<string | null>(null)
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)
  const isAuthorizedAdmin = hasValidAdminSession()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    serviceId: 'ambient-lighting',
    brand: '',
    model: '',
    title: '',
    description: '',
  })
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [projectPhotoFiles, setProjectPhotoFiles] = useState<Record<string, File[]>>({})
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectDraft, setEditingProjectDraft] = useState<ProjectDraft | null>(null)
  const [selectedManagedProjectId, setSelectedManagedProjectId] = useState('')
  const [projectStatus, setProjectStatus] = useState<string | null>(null)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [managerView, setManagerView] = useState<
    'projects' | 'homepage'
  >('projects')
  const [homepageImages, setHomepageImages] =
    useState<HomepageImageRecord[]>([])
  const [homepageImageFiles, setHomepageImageFiles] = useState<
    Partial<Record<HomepageImageSlot, File>>
  >({})
  const [homepageImagesLoading, setHomepageImagesLoading] = useState(true)
  const [homepageImageStatus, setHomepageImageStatus] =
    useState<string | null>(null)
  const [homepageInputVersion, setHomepageInputVersion] = useState(0)
  useEffect(() => {
    if (!isAuthorizedAdmin) {
      navigate({ to: '/portal' })
    }
  }, [isAuthorizedAdmin, navigate])

  useEffect(() => {
    let isActive = true

    void hydratePortalStateFromSupabase(getPortalState())
      .then((hydratedState) => {
        if (isActive) {
          setState(hydratedState)
        }
      })
      .catch((error) => {
        console.error('Failed to load portal data', error)
      })
      .finally(() => {
        if (isActive) {
          setPortalHydrated(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [])
  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setProjectsLoading(false)
      return
    }

    let isActive = true

    fetchProjects()
      .then((loadedProjects) => {
        if (isActive) {
          setProjects(loadedProjects)
        }
      })
      .catch((error) => {
        console.error('Failed to load projects', error)
        if (isActive) {
          setProjectStatus('Could not load projects.')
        }
      })
      .finally(() => {
        if (isActive) {
          setProjectsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isAuthorizedAdmin])
  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setHomepageImagesLoading(false)
      return
    }

    let isActive = true

    fetchHomepageImages()
      .then((images) => {
        if (isActive) {
          setHomepageImages(images)
        }
      })
      .catch((error) => {
        console.error('Failed to load homepage images', error)

        if (isActive) {
          setHomepageImageStatus('Could not load homepage images.')
        }
      })
      .finally(() => {
        if (isActive) {
          setHomepageImagesLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isAuthorizedAdmin])

  const saveHomepageImage = async (slot: HomepageImageSlot) => {
    const file = homepageImageFiles[slot]
    const slotDetails = HOMEPAGE_IMAGE_SLOTS.find(
      (item) => item.slot === slot,
    )

    if (!file || !slotDetails) {
      setHomepageImageStatus('Choose an image first.')
      return
    }

    try {
      setHomepageImagesLoading(true)
      setHomepageImageStatus(null)

      const savedImage = await uploadHomepageImage(
        slot,
        file,
        slotDetails.label,
      )

      setHomepageImages((current) => [
        ...current.filter((image) => image.slot !== slot),
        savedImage,
      ])
      setHomepageImageFiles((current) => {
        const nextFiles = { ...current }
        delete nextFiles[slot]
        return nextFiles
      })
      setHomepageInputVersion((current) => current + 1)
      setHomepageImageStatus(`${slotDetails.label} updated successfully.`)
    } catch (error) {
      console.error('Failed to save homepage image', error)
      setHomepageImageStatus(
        error instanceof Error
          ? error.message
          : 'Could not save homepage image.',
      )
    } finally {
      setHomepageImagesLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase()
    return state.customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.customerCode, customer.address, customer.email].join(' ').toLowerCase()
      return haystack.includes(query) || customer.name.toLowerCase().includes(query)
    })
  }, [search, state.customers])

  const CUSTOMERS_PER_PAGE = 5
  const [customerPage, setCustomerPage] = useState(1)

  const customerPageCount = Math.max(
    1,
    Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE),
  )

  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * CUSTOMERS_PER_PAGE
    return filteredCustomers.slice(start, start + CUSTOMERS_PER_PAGE)
  }, [customerPage, filteredCustomers])

  useEffect(() => {
    setCustomerPage(1)
  }, [search])

  useEffect(() => {
    if (customerPage > customerPageCount) {
      setCustomerPage(customerPageCount)
    }
  }, [customerPage, customerPageCount])

  const selectedVehicleModels = useMemo(() => {
    const make = vehicleDraft.make.trim()
    return VEHICLE_BRAND_MODELS[make] ?? []
  }, [vehicleDraft.make])

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
    setCustomerDraft(customer)
    setVehicleDraft(existingVehicle ?? makeVehicleDraft(customer.id))
    setEditingCustomerId(customer.id)
    setSelectedCustomerId(customer.id)
  }

  const cancelCustomerEdit = () => {
    setEditingCustomerId(null)
    setCustomerDraft(makeCustomerDraft())
    setVehicleDraft(makeVehicleDraft())
    setWarrantyDraft(makeWarrantyDraft())
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

    const nextState = editingServiceEntryId
  ? updatePortalServiceHistoryEntry(
      serviceEntry as ServiceHistoryEntry,
      state,
    )
  : addPortalServiceHistoryEntry(
      serviceEntry as ServiceHistoryEntry,
      state,
    )

setState(nextState)
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

const saveCustomer = async () => {
      if (!customerDraft.name.trim()) {
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
  : await createPortalCustomer(nextCustomer);
    if (editingCustomerId) {
            const customerVehicle = {
        ...vehicleDraft,
        customerId: editingCustomerId,
        id: vehicleDraft.id || `veh-${Math.random().toString(36).slice(2, 8)}`,
      }
      nextState = updatePortalVehicle(customerVehicle)
    }

    setState(nextState)
    resetServiceDraft()
    setCustomerDraft(makeCustomerDraft())
    setVehicleDraft(makeVehicleDraft())
    setWarrantyDraft(makeWarrantyDraft())
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

  const saveGalleryItem = async () => {
    const trimmedTitle = galleryDraft.title.trim()
    const trimmedDescription = galleryDraft.description.trim()
    const selectedImages = pendingGalleryImages.length
      ? pendingGalleryImages
      : galleryDraft.imageUrl.trim()
        ? [galleryDraft.imageUrl.trim()]
        : []

    if (!selectedImages.length) {
      return
    }

    const customerId = editingCustomerId ?? galleryDraft.customerId

    if (!customerId) {
      console.error('Cannot save gallery photo without a customer ID.')
      return
    }

    const fallbackTitle =
      trimmedTitle ||
      `Customer photo ${new Date().toISOString().slice(0, 10)}`

    try {
      let nextState = state

      for (const [index, imageUrl] of selectedImages.entries()) {
        const savedItem = await saveCustomerGalleryItem({
          ...galleryDraft,
          id: `${galleryDraft.id}-${Date.now()}-${index}`,
          title: fallbackTitle,
          description: trimmedDescription || 'Customer photo',
          imageUrl,
          category: galleryDraft.category || 'customer',
          featured: galleryDraft.featured ?? false,
          customerId,
        })

        nextState = updatePortalGallery(savedItem, nextState)
      }

      setState(nextState)
      setPendingGalleryImages([])
      setGalleryDraft(makeGalleryDraft(customerId))
    } catch (error) {
      console.error('Failed to save customer gallery photo', error)
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not save customer photo.',
      )
    }
  }

  const removeGalleryItem = async (itemId: string) => {
    try {
      await deleteCustomerGalleryItem(itemId)
      setState((current) => removePortalGalleryItem(itemId, current))
    } catch (error) {
      console.error('Failed to delete customer gallery photo', error)
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not delete customer photo.',
      )
    }
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

  const saveProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setProjectStatus(null)

    if (!projectFiles.length) {
      setProjectStatus('Select at least one project photo.')
      return
    }

    try {
      setProjectsLoading(true)
      const projectId = await createProject(projectDraft)
      setSelectedManagedProjectId(projectId)
      await uploadProjectImages(projectId, projectFiles)
      setProjects(await fetchProjects())

      setProjectDraft({
        serviceId: 'ambient-lighting',
        brand: '',
        model: '',
        title: '',
        description: '',
      })
      setProjectFiles([])
      form.reset()
      setProjectStatus('Project saved successfully.')
    } catch (error) {
      console.error('Failed to save project', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not save project.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }

  const removeProject = async (project: ProjectRecord) => {
    if (!window.confirm(`Delete "${project.title}" and all its photos?`)) {
      return
    }

    try {
      setProjectsLoading(true)
      setProjectStatus(null)
      await deleteProject(project)
      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      )
      setProjectStatus('Project deleted successfully.')
    } catch (error) {
      console.error('Failed to delete project', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not delete project.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }
  const startEditingProject = (project: ProjectRecord) => {
    setEditingProjectId(project.id)
    setEditingProjectDraft({
      slug: project.slug,
      serviceId: project.serviceId,
      brand: project.brand,
      model: project.model,
      title: project.title,
      description: project.description,
    })
    setProjectStatus(null)
  }

  const cancelEditingProject = () => {
    setEditingProjectId(null)
    setEditingProjectDraft(null)
  }

  const saveEditedProject = async () => {
    if (!editingProjectId || !editingProjectDraft) {
      return
    }

    try {
      setProjectsLoading(true)
      setProjectStatus(null)
      await updateProject(editingProjectId, editingProjectDraft)
      setProjects(await fetchProjects())
      setEditingProjectId(null)
      setEditingProjectDraft(null)
      setProjectStatus('Project information updated successfully.')
    } catch (error) {
      console.error('Failed to update project', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not update project.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }
  const uploadMoreProjectPhotos = async (projectId: string) => {
    const files = projectPhotoFiles[projectId] ?? []

    if (!files.length) {
      setProjectStatus('Select at least one photo to upload.')
      return
    }

    try {
      setProjectsLoading(true)
      setProjectStatus(null)
      await uploadProjectImages(projectId, files, false)
      setProjects(await fetchProjects())
      setProjectPhotoFiles((current) => ({
        ...current,
        [projectId]: [],
      }))
      setProjectStatus('Photos uploaded successfully.')
    } catch (error) {
      console.error('Failed to upload project photos', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not upload photos.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }

  const chooseProjectCover = async (
    projectId: string,
    mediaId: string,
  ) => {
    try {
      setProjectsLoading(true)
      setProjectStatus(null)
      await setProjectCover(projectId, mediaId)
      setProjects(await fetchProjects())
      setProjectStatus('Cover photo updated successfully.')
    } catch (error) {
      console.error('Failed to update project cover', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not update cover.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }

  const removeProjectPhoto = async (media: ProjectMedia) => {
    if (!window.confirm('Delete this photo permanently?')) {
      return
    }

    try {
      setProjectsLoading(true)
      setProjectStatus(null)
      await deleteProjectMedia(media)
      setProjects(await fetchProjects())
      setProjectStatus('Photo deleted successfully.')
    } catch (error) {
      console.error('Failed to delete project photo', error)
      setProjectStatus(
        error instanceof Error ? error.message : 'Could not delete photo.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }
  if (!portalHydrated) {
    return (
      <PortalShell
        active="admin"
        title="Admin Dashboard"
        subtitle="Loading your latest portal data..."
      >
        <div className="portal-card">
          <p className="portal-muted">Loading admin data...</p>
        </div>
      </PortalShell>
    )
  }
  return (
    <PortalShell active="admin" title="Admin Dashboard" subtitle="Operate Glowworks Lab from one premium control center.">
      <div className="portal-grid portal-grid-two">
        <div className="portal-card admin-operations-card">
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

      <section
        className="portal-card admin-project-manager-card"
        style={{ marginBottom: '20px' }}
      >
        <div className="portal-card-title-row">
          <div>
            <p className="portal-eyebrow">Public projects</p>
            <h3>Project Manager</h3>
          </div>
        <div
          className="portal-actions"
          style={{
            marginTop: '16px',
            marginBottom: '22px',
            gap: '10px',
          }}
        >
          <button
            className={`button ${
              managerView === 'projects'
                ? 'button-primary'
                : 'button-secondary'
            }`}
            type="button"
            onClick={() => setManagerView('projects')}
          >
            Manage projects
          </button>

          <button
            className={`button ${
              managerView === 'homepage'
                ? 'button-primary'
                : 'button-secondary'
            }`}
            type="button"
            onClick={() => setManagerView('homepage')}
          >
            Manage homepage images
          </button>
        </div>
          <div className="portal-chip">
            {managerView === 'projects'
              ? projectsLoading
                ? 'Loading...'
                : `${projects.length} projects`
              : homepageImagesLoading
                ? 'Loading...'
                : '6 image positions'}
          </div>
        </div>

        {managerView === 'projects' ? (
          <>
        <form onSubmit={saveProject}>
          <div className="form-grid">
            <label>
              <span>Service category</span>
              <select
                value={projectDraft.serviceId}
                onChange={(event) =>
                  setProjectDraft((current) => ({
                    ...current,
                    serviceId: event.target.value,
                  }))
                }
              >
                <option value="ambient-lighting">Ambient Lighting</option>
                <option value="custom-steering-wheels">
                  Custom Steering Wheels
                </option>
                <option value="starlight-headliner">
                  Starlight Headliner
                </option>
                <option value="screens-media">Screens &amp; Media</option>
                <option value="body-kit">
                  Body Kits &amp; Exterior Upgrades
                </option>
              </select>
            </label>

            <label>
              <span>Vehicle brand</span>
              <SearchableSelect
                value={projectDraft.brand}
                options={VEHICLE_BRAND_OPTIONS}
                placeholder="Search or enter a vehicle brand"
                emptyText="No matching brand - press Enter to add it"
                allowCustom
                onSelect={(brand) =>
                  setProjectDraft((current) => ({
                    ...current,
                    brand,
                    model: '',
                  }))
                }
              />
              <small>
                Select a standardized brand or enter a new manufacturer.
              </small>
            </label>

            <label>
              <span>Vehicle model / chassis</span>
              <SearchableSelect
                value={projectDraft.model}
                options={VEHICLE_BRAND_MODELS[projectDraft.brand] ?? []}
                placeholder={
                  projectDraft.brand
                    ? 'Search or enter a model/chassis'
                    : 'Choose the vehicle brand first'
                }
                emptyText="No matching model - press Enter to add it"
                allowCustom
                onSelect={(model) =>
                  setProjectDraft((current) => ({
                    ...current,
                    model,
                  }))
                }
              />
              <small>
                Select a known model or enter a completely new model/chassis.
              </small>
            </label>

            <label>
              <span>Project title</span>
              <input
                required
                value={projectDraft.title}
                onChange={(event) =>
                  setProjectDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Example: Ambient Lighting - Mercedes W205"
              />
            </label>

            <label className="full">
              <span>Description</span>
              <textarea
                value={projectDraft.description}
                onChange={(event) =>
                  setProjectDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the work completed on this vehicle."
              />
            </label>

            <label className="full">
              <span>Project photos</span>
              <input
                required
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) =>
                  setProjectFiles(Array.from(event.target.files ?? []))
                }
              />
              <small>
                {projectFiles.length
                  ? `${projectFiles.length} photo(s) selected`
                  : 'Select one or more photos. Maximum 15 MB each.'}
              </small>
            </label>
          </div>

          <div className="portal-actions" style={{ marginTop: '16px' }}>
            <button
              className="button button-primary"
              type="submit"
              disabled={projectsLoading}
            >
              {projectsLoading ? 'Saving...' : 'Create project'}
            </button>
          </div>
        </form>

        {projectStatus ? (
          <p className="portal-muted" style={{ marginTop: '12px' }}>
            {projectStatus}
          </p>
        ) : null}

        <div className="portal-list" style={{ marginTop: '20px' }}>
          {projects.length > 0 ? (
            <label
              className="full"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <span>Select an existing project</span>
              <select
                className="project-existing-select"
                value={selectedManagedProjectId}
                onChange={(event) => {
                  setSelectedManagedProjectId(event.target.value)
                  setEditingProjectId(null)
                  setEditingProjectDraft(null)
                }}
              >
                <option value="">Choose a project to manage</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} - {project.brand} {project.model}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {projects.length > 0 && !selectedManagedProjectId ? (
            <p className="portal-muted">
              Choose an existing project above to view and manage it.
            </p>
          ) : null}
          {!projectsLoading && projects.length === 0 ? (
            <p className="portal-muted">
              No Supabase projects have been created yet.
            </p>
          ) : null}

          {projects.filter((project) => project.id === selectedManagedProjectId).map((project) => {
            const cover =
              project.media.find((item) => item.isCover) ?? project.media[0]

            return (
              <div
                className="portal-row portal-row-with-actions"
                key={project.id}
              >
                <div className="portal-row-copy">
                  {cover ? (
                    <img
                      src={cover.publicUrl}
                      alt={cover.altText || project.title}
                      style={{
                        width: '120px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        marginBottom: '10px',
                      }}
                    />
                  ) : null}
                  <strong>{project.title}</strong>
                  <p>
                    {project.brand} - {project.model}
                  </p>
                  <span className="portal-chip">
                    {project.serviceId}
                  </span>
                  <p>{project.media.length} photo(s)</p>
                  {editingProjectId === project.id && editingProjectDraft ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: '12px',
                        marginTop: '16px',
                        padding: '14px',
                        border: '1px solid rgba(66,232,238,0.25)',
                        borderRadius: '12px',
                      }}
                    >
                      <label className="full">
                        <span>Service category</span>
                        <select
                          value={editingProjectDraft.serviceId}
                          onChange={(event) =>
                            setEditingProjectDraft((current) =>
                              current
                                ? { ...current, serviceId: event.target.value }
                                : current,
                            )
                          }
                        >
                          <option value="ambient-lighting">Ambient Lighting</option>
                          <option value="custom-steering-wheels">Custom Steering Wheels</option>
                          <option value="starlight-headliner">Starlight Headliner</option>
                          <option value="screens-media">Screens & Media</option>
                          <option value="body-kit">Body Kits & Exterior</option>
                        </select>
                      </label>

                      <label className="full">
                        <span>Vehicle brand</span>
                        <input
                          value={editingProjectDraft.brand}
                          onChange={(event) =>
                            setEditingProjectDraft((current) =>
                              current
                                ? { ...current, brand: event.target.value }
                                : current,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>Vehicle model</span>
                        <input
                          value={editingProjectDraft.model}
                          onChange={(event) =>
                            setEditingProjectDraft((current) =>
                              current
                                ? { ...current, model: event.target.value }
                                : current,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>Project title</span>
                        <input
                          value={editingProjectDraft.title}
                          onChange={(event) =>
                            setEditingProjectDraft((current) =>
                              current
                                ? { ...current, title: event.target.value }
                                : current,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>Description</span>
                        <textarea
                          value={editingProjectDraft.description}
                          onChange={(event) =>
                            setEditingProjectDraft((current) =>
                              current
                                ? { ...current, description: event.target.value }
                                : current,
                            )
                          }
                        />
                      </label>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="button button-primary portal-inline-button"
                          type="button"
                          disabled={projectsLoading}
                          onClick={() => void saveEditedProject()}
                        >
                          Save project changes
                        </button>

                        <button
                          className="button button-secondary portal-inline-button"
                          type="button"
                          disabled={projectsLoading}
                          onClick={cancelEditingProject}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '12px',
                      marginTop: '14px',
                    }}
                  >
                    {project.media.map((media) => (
                      <div
                        key={media.id}
                        style={{
                          padding: '8px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '12px',
                        }}
                      >
                        <img
                          src={media.publicUrl}
                          alt={media.altText || project.title}
                          style={{
                            width: '100%',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '8px',
                          }}
                        >
                          <button
                            className="button button-secondary portal-inline-button"
                            type="button"
                            disabled={projectsLoading || media.isCover}
                            onClick={() =>
                              void chooseProjectCover(project.id, media.id)
                            }
                          >
                            {media.isCover ? 'Cover photo' : 'Set as cover'}
                          </button>

                          <button
                            className="button button-secondary portal-inline-button"
                            type="button"
                            disabled={projectsLoading}
                            onClick={() => void removeProjectPhoto(media)}
                          >
                            <Trash2 size={13} /> Delete photo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <label
                    className="full"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '14px',
                    }}
                  >
                    <span>Add more project photos</span>
                    <input
                      key={`${project.id}-${projectPhotoFiles[project.id]?.length ?? 0}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      onChange={(event) =>
                        setProjectPhotoFiles((current) => ({
                          ...current,
                          [project.id]: Array.from(event.target.files ?? []),
                        }))
                      }
                    />
                  </label>

                  <button
                    className="button button-primary portal-inline-button"
                    type="button"
                    disabled={
                      projectsLoading ||
                      !(projectPhotoFiles[project.id]?.length)
                    }
                    onClick={() => void uploadMoreProjectPhotos(project.id)}
                    style={{ marginTop: '10px' }}
                  >
                    Upload selected photos
                  </button>
                </div>

                <div className="portal-row-meta">
                  <button
                    className="button button-secondary portal-inline-button"
                    type="button"
                    disabled={projectsLoading}
                    onClick={() => startEditingProject(project)}
                  >
                    <PencilLine size={14} /> Edit project
                  </button>
                  <button
                    className="button button-secondary portal-inline-button"
                    type="button"
                    disabled={projectsLoading}
                    onClick={() => void removeProject(project)}
                  >
                    <Trash2 size={14} /> Delete project
                  </button>
                </div>
              </div>
            )
          })}
        </div>
          </>
        ) : (
          <div>
            <p className="portal-muted" style={{ marginBottom: '18px' }}>
              Select an image position and upload its replacement. Changes
              appear on the public homepage on every device.
            </p>

            {homepageImageStatus ? (
              <p className="portal-muted" style={{ marginBottom: '18px' }}>
                {homepageImageStatus}
              </p>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {HOMEPAGE_IMAGE_SLOTS.map((item) => {
                const savedImage = homepageImages.find(
                  (image) => image.slot === item.slot,
                )
                const selectedFile = homepageImageFiles[item.slot]

                return (
                  <article
                    className="portal-row"
                    key={item.slot}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: '12px',
                    }}
                  >
                    <img
                      src={savedImage?.publicUrl ?? item.fallbackImage}
                      alt={savedImage?.altText || item.label}
                      style={{
                        width: '100%',
                        height: item.slot === 'hero' ? '180px' : '150px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                      }}
                    />

                    <div className="portal-row-copy">
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                      <small className="portal-muted">
                        {savedImage
                          ? 'Current homepage image'
                          : 'Current local fallback image'}
                      </small>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <span>Choose replacement image</span>
                      <input
                        key={`${item.slot}-${homepageInputVersion}`}
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0]

                          setHomepageImageFiles((current) => {
                            const nextFiles = { ...current }

                            if (file) {
                              nextFiles[item.slot] = file
                            } else {
                              delete nextFiles[item.slot]
                            }

                            return nextFiles
                          })
                        }}
                      />
                    </label>

                    <button
                      className="button button-primary"
                      type="button"
                      disabled={!selectedFile || homepageImagesLoading}
                      onClick={() => void saveHomepageImage(item.slot)}
                    >
                      {homepageImagesLoading
                        ? 'Saving...'
                        : selectedFile
                          ? 'Upload selected image'
                          : 'Choose an image first'}
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>
      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Search customers</h3>
          <div className="portal-chip"><Search size={15} /> Live</div>
        </div>
        <div className="admin-customer-search">
          <div className="admin-customer-search-field">
            <Search size={21} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer name, phone, plate or ID"
            />
          </div>
        </div>
        <div className="portal-list" style={{ marginTop: '16px' }}>
          {paginatedCustomers.map((customer) => (
            <article
              className="admin-customer-premium-card"
              key={customer.id}
            >
              <div className="admin-customer-premium-top">
                <div className="admin-customer-identity">
                  <div className="admin-customer-avatar">
                    <UserRound size={22} />
                  </div>

                  <div className="admin-customer-identity-copy">
                    <strong className="admin-customer-premium-name">
                      {customer.name}
                    </strong>

                    <div className="admin-customer-premium-contact">
                      {customer.email ? (
                        <span>
                          <Mail size={13} />
                          {customer.email}
                        </span>
                      ) : null}

                      {customer.phone ? (
                        <span>
                          <Phone size={13} />
                          {customer.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <span className="admin-customer-premium-status">
                  NFC / QR READY
                </span>
              </div>

              <div className="admin-customer-premium-divider" />

              <div className="admin-customer-premium-meta">
                <div>
                  <span className="admin-customer-premium-label">
                    CUSTOMER LINK
                  </span>

                  <div className="admin-customer-link-value">
                    <Link2 size={14} />
                    <code>
                      {`/customer/${customer.customerCode}`}
                    </code>
                  </div>
                </div>

                <div>
                  <span className="admin-customer-premium-label">
                    CUSTOMER ID
                  </span>

                  <span className="admin-customer-premium-code">
                    {customer.customerCode}
                  </span>
                </div>
              </div>

              <div className="admin-customer-premium-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void copyCustomerPortalLink(customer)}
                >
                  <Copy size={15} />
                  {copiedCustomerId === customer.id
                    ? 'Copied'
                    : 'Copy NFC URL'}
                </button>

                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => openCustomerProfile(customer)}
                >
                  <ExternalLink size={15} />
                  Open profile
                </button>

                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => startEditingCustomer(customer)}
                >
                  <PencilLine size={15} />
                  Edit
                </button>
              </div>

              {customer.address ? (
                <div className="admin-customer-premium-address">
                  <MapPin size={15} />
                  <span>{customer.address}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {filteredCustomers.length > CUSTOMERS_PER_PAGE ? (
          <div
            className="portal-actions"
            style={{
              marginTop: '16px',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              className="button button-secondary portal-inline-button"
              type="button"
              disabled={customerPage === 1}
              onClick={() => setCustomerPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>

            <span className="portal-muted">
              Page {customerPage} of {customerPageCount}
            </span>

            <button
              className="button button-secondary portal-inline-button"
              type="button"
              disabled={customerPage === customerPageCount}
              onClick={() =>
                setCustomerPage((current) =>
                  Math.min(customerPageCount, current + 1),
                )
              }
            >
              Next
            </button>
          </div>
        ) : null}
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
                <span>Email (optional)</span>
                <input value={customerDraft.email} onChange={(event) => setCustomerDraft((current) => ({ ...current, email: event.target.value }))} placeholder="email@example.com" />
              </label>
              <label>
                <span>Phone (optional)</span>
                <input value={customerDraft.phone} onChange={(event) => setCustomerDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
              </label>
              <label className="full">
                <span>Address (optional)</span>
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
              </label>              <div className="full portal-benefit-status">
                <span>60-day benefit status</span>
                <strong>{getCustomerBenefitStatus(customerDraft).label}</strong>
                <small>{getCustomerBenefitStatus(customerDraft).detail}</small>
              </div>
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
                  options={VEHICLE_BRAND_OPTIONS}
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
                <span>Plate (optional)</span>
                <input value={vehicleDraft.plate} onChange={(event) => setVehicleDraft((current) => ({ ...current, plate: event.target.value }))} placeholder="RO-4821" />
              </label>
              <label>
                <span>VIN (optional)</span>
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
              <input value={serviceDraft.warrantyCoverage} onChange={(event) => setServiceDraft((current) => ({ ...current, warrantyCoverage: event.target.value }))} placeholder="2 years workmanship + support" />
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
                        <p>{entry.completedOn} - {entry.vehicle || 'Vehicle'}</p>
                        {(() => {
                          const serviceWarranty = state.warranties.find((warranty) => warranty.id === entry.warrantyId)
                          if (!serviceWarranty) {
                            return null
                          }

                          return (
                            <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem' }}>
                              Warranty: {serviceWarranty.warrantyNumber ?? 'Service warranty'} - {serviceWarranty.status} - Ends {serviceWarranty.endsOn}
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
          <h3>Selected customer workspace</h3>
          <div className="portal-chip"><UserPlus size={15} /> Profile</div>
        </div>
        <p className="portal-muted">Choose a customer from the list above. Once the profile is open, you can add photos and adjust discount settings directly from that customer profile screen.</p>
      </div>
    </PortalShell>
  )
}
