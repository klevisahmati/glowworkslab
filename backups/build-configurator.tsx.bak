import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CarFront,
  Check,
  ChevronDown,
  ImagePlus,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjects } from '../lib/projects'
import type { ProjectRecord } from '../types/projects'

export const Route = createFileRoute('/build')({
  component: BuildConfiguratorPage,
  head: () => ({
    meta: [
      { title: 'Build Your Car - Glowworks.lab' },
      {
        name: 'description',
        content: 'Create a personal Glowworks.lab concept around your own vehicle.',
      },
    ],
  }),
})

type UpgradeGroup = 'interior' | 'exterior'

type UpgradeOption = {
  id: string
  title: string
  description: string
  group: UpgradeGroup
  serviceIds: string[]
}

type CustomerPhoto = {
  id: string
  name: string
  url: string
}

const OTHER_VEHICLE = '__other__'

const upgradeOptions: UpgradeOption[] = [
  { id: 'ambient-lighting', title: 'Ambient Lighting', description: 'Create the colour, zones and atmosphere you want.', group: 'interior', serviceIds: ['ambient-lighting'] },
  { id: 'starlight-headliner', title: 'Starlight Headliner', description: 'Choose a subtle night sky or a dramatic cabin statement.', group: 'interior', serviceIds: ['starlight-headliner'] },
  { id: 'custom-steering-wheel', title: 'Custom Steering Wheel', description: 'Leather, Alcantara, carbon, stitching and centre stripe ideas.', group: 'interior', serviceIds: ['custom-steering-wheels', 'carbon-steering-wheels', 'leather-steering-wheel-covers'] },
  { id: 'screens-media', title: 'Screens & Media', description: 'Display, CarPlay, Android Auto and multimedia upgrades.', group: 'interior', serviceIds: ['screens-media'] },
  { id: 'body-kit', title: 'Exterior Styling', description: 'Front lip, diffuser, spoiler, side skirts and custom details.', group: 'exterior', serviceIds: ['body-kit'] },
  { id: 'window-tint', title: 'Window Tint', description: 'Choose the appearance, privacy and protection you prefer.', group: 'exterior', serviceIds: ['window-tint'] },
]

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function getAssetPath(path: string) {
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

function getProjectCover(project: ProjectRecord) {
  const images = project.media.filter((media) => media.mediaType === 'image')
  return images.find((media) => media.isCover) ?? images[0] ?? null
}


function BuildConfiguratorPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [brandChoice, setBrandChoice] = useState('')
  const [modelChoice, setModelChoice] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [activeGroup, setActiveGroup] = useState<'all' | UpgradeGroup>('all')
  const [selectedUpgradeIds, setSelectedUpgradeIds] = useState<string[]>([])
  const [photos, setPhotos] = useState<CustomerPhoto[]>([])
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
  const [customIdea, setCustomIdea] = useState('')
  useEffect(() => {
    let active = true
    fetchProjects()
      .then((records) => { if (active) setProjects(records) })
      .catch((error) => console.error('Failed to load configurator projects', error))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const brands = useMemo(
    () => Array.from(new Set(projects.map((project) => project.brand.trim()).filter(Boolean))).sort(),
    [projects],
  )

  const models = useMemo(() => {
    if (!brandChoice || brandChoice === OTHER_VEHICLE) return []
    return Array.from(new Set(
      projects
        .filter((project) => normalize(project.brand) === normalize(brandChoice))
        .map((project) => project.model.trim())
        .filter(Boolean),
    )).sort()
  }, [projects, brandChoice])

  const selectedBrand = brandChoice === OTHER_VEHICLE ? customBrand.trim() : brandChoice
  const selectedModel = modelChoice === OTHER_VEHICLE ? customModel.trim() : modelChoice
  const vehicleReady = Boolean(selectedBrand && selectedModel)

  const selectedOptions = useMemo(
    () => upgradeOptions.filter((option) => selectedUpgradeIds.includes(option.id)),
    [selectedUpgradeIds],
  )

  const inspirationProjects = useMemo(() => {
    if (!vehicleReady) return []
    const exact = projects.filter((project) =>
      normalize(project.brand) === normalize(selectedBrand) &&
      normalize(project.model) === normalize(selectedModel) &&
      getProjectCover(project),
    )
    const sameBrand = projects.filter((project) =>
      normalize(project.brand) === normalize(selectedBrand) &&
      getProjectCover(project) &&
      !exact.some((item) => item.slug === project.slug),
    )
    return [...exact, ...sameBrand].slice(0, 4)
  }, [projects, selectedBrand, selectedModel, vehicleReady])

  const visibleOptions = upgradeOptions.filter((option) => activeGroup === 'all' || option.group === activeGroup)
  const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? photos[0]

  const handlePhotos = (files: FileList | null) => {
    if (!files) return
    const available = Math.max(0, 4 - photos.length)
    const additions = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, available)
      .map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }))
    setPhotos((current) => [...current, ...additions])
    if (!activePhotoId && additions[0]) setActivePhotoId(additions[0].id)
  }

  const removePhoto = (id: string) => {
    const target = photos.find((photo) => photo.id === id)
    if (target) URL.revokeObjectURL(target.url)
    const remaining = photos.filter((photo) => photo.id !== id)
    setPhotos(remaining)
    if (activePhotoId === id) setActivePhotoId(remaining[0]?.id ?? null)
  }

  const toggleUpgrade = (id: string) => {
    setSelectedUpgradeIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const resetBuild = () => {
    setSelectedUpgradeIds([])
    setCustomIdea('')
  }

  const requestSummary = [
    `Personal build: ${selectedBrand} ${selectedModel}`,
    `Upgrades: ${selectedOptions.map((option) => option.title).join(', ')}`,
    customIdea.trim() ? `Customer idea: ${customIdea.trim()}` : '',
    photos.length ? `${photos.length} vehicle photo(s) prepared in the configurator; Glowworks should request the original files.` : '',
  ].filter(Boolean).join(' | ')

  const bookingParams = new URLSearchParams({
    service: 'Glowworks Build',
    brand: selectedBrand,
    model: selectedModel,
    project: requestSummary,
  })
  const bookingHref = `${getAssetPath('/')}?${bookingParams.toString()}#booking`
  const canContinue = vehicleReady && selectedOptions.length > 0

  return (
    <main className="build-page">
      <nav className="build-nav">
        <div className="shell build-nav-inner">
          <a className="brand" href={getAssetPath('/')} aria-label="Glowworks.lab home">
            <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
          </a>
          <a className="build-back-link" href={getAssetPath('/projects')}><ArrowLeft size={16} /> Project garage</a>
        </div>
      </nav>

      <header className="build-hero">
        <div className="shell build-hero-layout">
          <div>
            <p className="eyebrow"><span /> Personal design studio</p>
            <h1>Your car.<br /><em>Your vision.</em></h1>
          </div>
          <p>Ξεκίνα από το δικό σου αυτοκίνητο, όχι από το project κάποιου άλλου. Δείξε μας το όχημά σου, επίλεξε όσα θέλεις και περιέγραψε το αποτέλεσμα που έχεις στο μυαλό σου.</p>
        </div>
      </header>

      <section className="build-workspace">
        <div className="shell">
          <section className="build-stage build-vehicle-picker">
            <div className="build-picker-heading">
              <span>01</span>
              <div><p>Your vehicle</p><h2>Tell us what you drive.</h2></div>
            </div>
            <div className="build-select-grid">
              <label><span>Brand</span><div className="build-select-wrap">
                <select value={brandChoice} onChange={(event) => { setBrandChoice(event.target.value); setModelChoice(''); setCustomBrand(''); setCustomModel('') }} disabled={loading}>
                  <option value="">{loading ? 'Loading vehicles...' : 'Select brand'}</option>
                  {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
                  <option value={OTHER_VEHICLE}>Other brand</option>
                </select><ChevronDown size={17} />
              </div></label>
              {brandChoice === OTHER_VEHICLE ? (
                <label><span>Your brand</span><input className="build-text-input" value={customBrand} onChange={(event) => setCustomBrand(event.target.value)} placeholder="e.g. Cupra" /></label>
              ) : null}
              {brandChoice ? <label><span>Model</span><div className="build-select-wrap">
                <select value={modelChoice} onChange={(event) => { setModelChoice(event.target.value); setCustomModel('') }}>
                  <option value="">Select model</option>
                  {models.map((model) => <option value={model} key={model}>{model}</option>)}
                  <option value={OTHER_VEHICLE}>Other model</option>
                </select><ChevronDown size={17} />
              </div></label> : null}
              {modelChoice === OTHER_VEHICLE ? (
                <label><span>Your model</span><input className="build-text-input" value={customModel} onChange={(event) => setCustomModel(event.target.value)} placeholder="e.g. Formentor VZ" /></label>
              ) : null}
            </div>
          </section>

          {vehicleReady ? (
            <>
              <section className="build-personal-grid">
                <div className="build-photo-studio">
                  <div className="build-section-heading"><span>02</span><div><p>Your canvas</p><h2>Upload your car.</h2></div></div>
                  <div className={`build-canvas${activePhoto ? ' has-photo' : ''}`}>
                    {activePhoto ? <img src={activePhoto.url} alt={`${selectedBrand} ${selectedModel} uploaded by customer`} /> : (
                      <div className="build-canvas-empty"><Camera size={45} /><strong>Your vehicle starts here</strong><span>Add a clear exterior or interior photo.</span></div>
                    )}
                    <div className="build-canvas-badge"><CarFront size={15} /> Your {selectedBrand} {selectedModel}</div>
                  </div>
                  <div className="build-photo-strip">
                    {photos.map((photo) => (
                      <button type="button" className={`build-photo-thumb${activePhoto?.id === photo.id ? ' is-active' : ''}`} key={photo.id} onClick={() => setActivePhotoId(photo.id)}>
                        <img src={photo.url} alt={photo.name} />
                        <span onClick={(event) => { event.stopPropagation(); removePhoto(photo.id) }}><X size={13} /></span>
                      </button>
                    ))}
                    {photos.length < 4 ? <label className="build-photo-add"><ImagePlus size={20} /><span>Add photo</span><input type="file" accept="image/*" multiple onChange={(event) => { handlePhotos(event.target.files); event.currentTarget.value = '' }} /></label> : null}
                  </div>
                  <p className="build-upload-note"><Upload size={15} /> Up to 4 photos. They stay only in this browser preview for now and are not uploaded yet.</p>
                </div>

                <div className="build-options-column">
                  <div className="build-options-heading"><div><p>03 / Select upgrades</p><h2>Make it yours.</h2></div><button type="button" onClick={resetBuild} disabled={!selectedUpgradeIds.length && !customIdea}><RotateCcw size={15} /> Reset</button></div>
                  <div className="build-filter-tabs">
                    {(['all', 'interior', 'exterior'] as const).map((group) => <button className={activeGroup === group ? 'is-active' : ''} type="button" key={group} onClick={() => setActiveGroup(group)}>{group}</button>)}
                  </div>
                  <div className="build-option-list">
                    {visibleOptions.map((option) => {
                      const selected = selectedUpgradeIds.includes(option.id)
                      return <button className={`build-option${selected ? ' is-selected' : ''}`} type="button" key={option.id} onClick={() => toggleUpgrade(option.id)}>
                        <span className="build-option-check">{selected ? <Check size={16} /> : null}</span>
                        <span className="build-option-copy"><strong>{option.title}</strong><small>{option.description}</small><em>Personalized for your vehicle</em></span>
                        <ArrowRight size={17} />
                      </button>
                    })}
                  </div>
                  <label className="build-idea-field"><span>Η δική σου ιδέα</span><textarea value={customIdea} onChange={(event) => {
  setCustomIdea(event.target.value)
}} placeholder="Περιέγραψε χρώματα, υλικά, στυλ, λεπτομέρειες ή μια εντελώς διαφορετική ιδέα..." maxLength={1000} /><small>{customIdea.length}/1000</small></label>
                </div>
              </section>

              <section className="build-ai-stage">
                <div className="build-ai-copy">
                  <p className="eyebrow"><span /> 04 / Προεπισκόπηση ιδέας</p>
                  <h2>Δες την κατεύθυνση πριν την υλοποιήσουμε.</h2>
                  <p>
                    Σε επόμενη έκδοση, θα μπορείς να δημιουργήσεις ένα AI concept
                    βασισμένο στη φωτογραφία του οχήματός σου και στις επιλογές σου.
                  </p>
                </div>

                <div className="build-ai-card">
                  <Sparkles size={29} />
                  <strong>AI προεπισκόπηση concept</strong>
                  <span>
                    Η λειτουργία βρίσκεται υπό ανάπτυξη και θα προστεθεί σε επόμενη έκδοση.
                  </span>

                  <button
                    className="build-ai-generate"
                    type="button"
                    disabled
                  >
                    Σύντομα διαθέσιμο
                  </button>
                </div>
              </section>

              {inspirationProjects.length ? <section className="build-inspiration">
                <div className="build-inspiration-heading"><div><p>Optional inspiration</p><h2>Ideas from the Glowworks garage.</h2></div><span>These are references only. They do not replace your personal build.</span></div>
                <div className="build-inspiration-grid">{inspirationProjects.map((project) => {
                  const cover = getProjectCover(project)
                  if (!cover) return null
                  return <a href={getAssetPath(`/project/${project.slug}`)} key={project.slug}><img src={getAssetPath(cover.publicUrl)} alt={project.title} /><span>{project.title}</span><small>View inspiration</small></a>
                })}</div>
              </section> : null}

              <section className="build-summary">
                <div className="build-summary-heading"><div><p className="eyebrow"><span /> 05 / Your request</p><h2>Your personal build.</h2></div><strong>{String(selectedOptions.length).padStart(2, '0')}</strong></div>
                <div className="build-summary-grid">
                  <div className="build-summary-list">
                    <div className="build-summary-vehicle"><CarFront size={19} /><span>{selectedBrand} {selectedModel}</span></div>
                    {selectedOptions.map((option, index) => <div className="build-summary-item" key={option.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{option.title}</strong><BadgeCheck size={17} /></div>)}
                    {customIdea.trim() ? <div className="build-summary-idea"><strong>Your direction</strong><p>{customIdea}</p></div> : null}
                    {!selectedOptions.length ? <p className="build-summary-empty">Choose at least one upgrade to prepare your request.</p> : null}
                  </div>
                  <div className="build-contact-card build-form-handoff"><div className="build-form-handoff-icon"><Send size={22} /></div><p>Continue to the existing Glowworks request form. Your vehicle, upgrades and written idea will be transferred automatically.</p><a className={`button button-primary build-send${canContinue ? '' : ' is-disabled'}`} href={canContinue ? bookingHref : undefined} aria-disabled={!canContinue} onClick={(event) => { if (!canContinue) event.preventDefault() }}>Continue to request form <ArrowRight size={17} /></a><small>Your temporary photo previews are not sent yet. The secure photo and AI connection will be added in the next stage.</small></div>
                </div>
              </section>
            </>
          ) : <div className="build-empty-state"><CarFront size={38} /><p>Select or enter your brand and model to begin.</p></div>}
        </div>
      </section>
    </main>
  )
}