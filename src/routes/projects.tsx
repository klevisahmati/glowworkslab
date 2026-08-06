import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Camera, CarFront, Sparkles, Star, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getPortalState } from '../lib/portal-session'
import { DEFAULT_WEBSITE_CONTENT, SERVICE_SEARCH_ALIASES, type WebsiteContent } from '../lib/site-content'

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: 'Projects — Glowworks.lab' },
      {
        name: 'description',
        content: 'Δες τα custom automotive interior projects της Glowworks.lab ανά μάρκα και μοντέλο.',
      },
    ],
  }),
})

function getAssetPath(path: string) {
  const normalizedBase = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/') ? `${normalizedBase}${path}` : `${normalizedBase}/${path}`
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

function getServiceIcon(serviceId: string) {
  switch (serviceId) {
    case 'ambient-lighting':
      return Sparkles
    case 'carbon-steering-wheels':
      return BadgeCheck
    case 'starlight-headliner':
      return Star
    case 'body-kit':
      return Zap
    default:
      return CarFront
  }
}

function ProjectsPage() {
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(DEFAULT_WEBSITE_CONTENT)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)

  useEffect(() => {
    const loaded = getPortalState().websiteContent
    if (loaded) {
      setWebsiteContent(loaded)
    }
  }, [])

  const serviceCategories = useMemo(() => websiteContent.services.map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    icon: getServiceIcon(service.id),
  })), [websiteContent.services])

  const projectGallery = useMemo(() => websiteContent.projects, [websiteContent.projects])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const requestedService = params.get('service')?.trim().toLowerCase()
    if (!requestedService) {
      return
    }

    const resolvedServiceId = SERVICE_SEARCH_ALIASES[requestedService]
    if (!resolvedServiceId || resolvedServiceId === activeServiceId) {
      return
    }

    setActiveServiceId(resolvedServiceId)
    setActiveBrand(null)
    setActiveModel(null)
  }, [activeServiceId])

  const selectedService = useMemo(
    () => serviceCategories.find((service) => service.id === activeServiceId) ?? null,
    [activeServiceId],
  )

  const availableBrands = useMemo(() => {
    if (!activeServiceId) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)

    return Array.from(new Set(projectGallery
      .filter((item) => normalizeValue(item.serviceId) === selectedServiceKey)
      .map((item) => item.brand.trim())))
  }, [activeServiceId])

  const availableModels = useMemo(() => {
    if (!activeServiceId || !activeBrand) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)
    const selectedBrandKey = normalizeValue(activeBrand)

    return Array.from(new Set(
      projectGallery
        .filter((item) => normalizeValue(item.serviceId) === selectedServiceKey && normalizeValue(item.brand) === selectedBrandKey)
        .map((item) => item.model.trim()),
    ))
  }, [activeServiceId, activeBrand])

  const visibleProjects = useMemo(() => {
    if (!activeServiceId || !activeBrand || !activeModel) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)
    const selectedBrandKey = normalizeValue(activeBrand)
    const selectedModelKey = normalizeValue(activeModel)

    return projectGallery.filter((item) => normalizeValue(item.serviceId) === selectedServiceKey && normalizeValue(item.brand) === selectedBrandKey && normalizeValue(item.model) === selectedModelKey)
  }, [activeServiceId, activeBrand, activeModel])

  return (
    <main className="projects-page" id="top">
      <nav className="site-nav project-nav is-scrolled">
        <div className="nav-shell">
          <a className="brand" href={getAssetPath('/')} aria-label="Glowworks.lab αρχική">
            <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
          </a>
          <div className="project-nav-links">
            <a href={getAssetPath('/')}><ArrowLeft size={16} /> Αρχική</a>
            <a className="nav-book" href={getAssetPath('/#booking')}>Κλείσε ραντεβού <ArrowUpRight size={15} /></a>
          </div>
        </div>
      </nav>

      <header className="projects-hero">
        <div className="projects-hero-orbit" aria-hidden="true" />
        <div className="shell projects-hero-layout">
          <div className="projects-hero-copy reveal">
            <p className="eyebrow"><span /> Glowworks archive</p>
            <h1>Project<br /><em>garage.</em></h1>
            <p>
              Επίλεξε μάρκα και ανακάλυψε τις μεταμορφώσεις εσωτερικού που δημιουργήσαμε για κάθε μοντέλο.
            </p>
          </div>
          <div className="projects-counter reveal reveal-delay">
            <strong>{String(projectGallery.length).padStart(2, '0')}</strong>
            <span>μοντέλα στο<br />project archive</span>
          </div>
        </div>
      </header>

      <section className="projects-archive" aria-labelledby="projects-title">
        <div className="shell">
          <div className="projects-toolbar">
            <div>
              <p className="section-index">01 / Project gallery</p>
              <h2 id="projects-title">Choose your upgrade.</h2>
            </div>
            <p className="projects-result-count">
              {String(visibleProjects.length).padStart(2, '0')} gallery items
            </p>
          </div>

          <div className="project-stepper" aria-label="Project selection path">
            <span className={`project-step ${selectedService ? 'is-active' : ''}`}>Service</span>
            <span className={`project-step ${activeBrand ? 'is-active' : ''}`}>Brand</span>
            <span className={`project-step ${activeModel ? 'is-active' : ''}`}>Model</span>
            <span className={`project-step ${visibleProjects.length > 0 ? 'is-active' : ''}`}>Gallery</span>
          </div>

          <div className="project-step-intro">
            {selectedService ? (
              <>
                <p className="eyebrow"><span /> {selectedService.title}</p>
                <h3>{selectedService.description}</h3>
              </>
            ) : (
              <>
                <p className="eyebrow"><span /> Browse by service</p>
                <h3>Pick the upgrade you want to explore first.</h3>
              </>
            )}
          </div>

          {!activeServiceId && (
            <div className="project-choice-grid" role="list">
              {serviceCategories.map((service) => {
                const Icon = service.icon

                return (
                  <button
                    className="project-choice-card"
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setActiveServiceId(service.id)
                      setActiveBrand(null)
                      setActiveModel(null)
                    }}
                  >
                    <span className="project-choice-icon"><Icon size={20} /></span>
                    <div>
                      <h4>{service.title}</h4>
                      <p>{service.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {activeServiceId && !activeBrand && (
            <div className="project-choice-panel">
              <button className="project-back" type="button" onClick={() => {
                setActiveServiceId(null)
                setActiveBrand(null)
                setActiveModel(null)
              }}>
                <ArrowLeft size={15} /> Back to services
              </button>

              <div className="project-choice-grid" role="list">
                {availableBrands.map((brand) => (
                  <button
                    className="project-choice-card"
                    key={brand}
                    type="button"
                    onClick={() => {
                      setActiveBrand(brand)
                      setActiveModel(null)
                    }}
                  >
                    <span className="project-choice-icon"><CarFront size={20} /></span>
                    <div>
                      <h4>{brand}</h4>
                      <p>Show all models for this manufacturer.</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeServiceId && activeBrand && !activeModel && (
            <div className="project-choice-panel">
              <button className="project-back" type="button" onClick={() => {
                setActiveBrand(null)
                setActiveModel(null)
              }}>
                <ArrowLeft size={15} /> Back to brands
              </button>

              <div className="project-choice-grid" role="list">
                {availableModels.map((model) => (
                  <button
                    className="project-choice-card"
                    key={model}
                    type="button"
                    onClick={() => setActiveModel(model)}
                  >
                    <span className="project-choice-icon"><BadgeCheck size={20} /></span>
                    <div>
                      <h4>{model}</h4>
                      <p>Open the gallery for this exact model.</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeServiceId && activeBrand && activeModel && (
            <div className="project-choice-panel">
              <button className="project-back" type="button" onClick={() => setActiveModel(null)}>
                <ArrowLeft size={15} /> Back to models
              </button>

              <div className="projects-grid">
                {visibleProjects.map((project, index) => (
                  <article className={`project-card project-card-${(index % 5) + 1}`} key={`${project.brand}-${project.model}-${index}`}>
                    <img src={getAssetPath(project.image)} alt={project.title} />
                    <div className="project-card-shade" />
                    <div className="project-card-topline">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span className="project-photo-status"><Camera size={14} /> Gallery</span>
                    </div>
                    <div className="project-card-copy">
                      <p>{selectedService?.title}</p>
                      <h3>{project.model}</h3>
                      <span>{project.brand}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="projects-cta">
        <div className="shell projects-cta-layout">
          <div>
            <p className="eyebrow"><span /> Your car, next</p>
            <h2>Το επόμενο project μπορεί να είναι το δικό σου.</h2>
          </div>
          <a className="button button-primary" href={getAssetPath('/#booking')}>Στείλε το όχημά σου <ArrowUpRight size={19} /></a>
        </div>
      </section>

      <footer className="site-footer project-footer">
        <div className="shell footer-main">
          <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
          <p>Custom interior upgrades<br />στη Ρόδο.</p>
          <a href="#top">Back to top <ArrowUpRight size={16} /></a>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Glowworks.lab</span>
          <span>Rhodes, Greece</span>
          <a href="https://www.instagram.com/glowworks.lab/" target="_blank" rel="noreferrer">@glowworks.lab</a>
        </div>
      </footer>
    </main>
  )
}
