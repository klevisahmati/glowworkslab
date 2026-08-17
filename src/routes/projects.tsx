import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Camera, CarFront, ChevronLeft, ChevronRight, Sparkles, Star, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjects } from '../lib/projects'
import type { ProjectMedia, ProjectRecord } from '../types/projects'
export const Route = createFileRoute('/projects')({
  validateSearch: (search: Record<string, unknown>) => ({
    service:
      typeof search.service === 'string'
        ? search.service
        : undefined,
  }),


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

type ServiceCategory = {
  id: string
  title: string
  description: string
  icon: typeof Sparkles
}

type ProjectGalleryItem = {
  slug: string
  serviceId: string
  brand: string
  model: string
  image: string
  title: string
}

function getAssetPath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedBase = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/') ? `${normalizedBase}${path}` : `${normalizedBase}/${path}`
}

const BRAND_LOGO_PATHS: Record<string, string> = {
  'alfa romeo': '/images/brands/alfa-romeo.svg',
  'alfa-romeo': '/images/brands/alfa-romeo.svg',
  'aston martin': '/images/brands/aston-martin.svg',
  'aston-martin': '/images/brands/aston-martin.svg',
  audi: '/images/brands/audi.svg',
  bentley: '/images/brands/bentley.svg',
  bmw: '/images/brands/bmw.svg',
  bugatti: '/images/brands/bugatti.svg',
  byd: '/images/brands/byd.svg',
  citroen: '/images/brands/citroen.svg',
  dodge: '/images/brands/dodge.svg',
  fiat: '/images/brands/fiat.svg',
  ford: '/images/brands/ford.svg',
  honda: '/images/brands/honda.svg',
  hyundai: '/images/brands/hyundai.svg',
  jaguar: '/images/brands/jaguar.svg',
  jeep: '/images/brands/jeep.svg',
  kia: '/images/brands/kia.svg',
  lamborghini: '/images/brands/lamborghini.svg',
  lexus: '/images/brands/lexus.svg',
  maserati: '/images/brands/maserati.svg',
  mazda: '/images/brands/mazda.svg',
  mclaren: '/images/brands/mclaren.svg',
  mercedes: '/images/brands/mercedes-benz.svg',
  'mercedes-benz': '/images/brands/mercedes-benz.svg',
  mini: '/images/brands/mini.svg',
  mitsubishi: '/images/brands/mitsubishi.svg',
  nissan: '/images/brands/nissan.svg',
  opel: '/images/brands/opel.svg',
  peugeot: '/images/brands/peugeot.svg',
  porsche: '/images/brands/porsche.svg',
  renault: '/images/brands/renault.svg',
  'rolls royce': '/images/brands/rolls-royce.svg',
  'rolls-royce': '/images/brands/rolls-royce.svg',
  rollsroyce: '/images/brands/rolls-royce.svg',
  seat: '/images/brands/seat.svg',
  skoda: '/images/brands/skoda.svg',
  smart: '/images/brands/smart.svg',
  subaru: '/images/brands/subaru.svg',
  suzuki: '/images/brands/suzuki.svg',
  tesla: '/images/brands/tesla.svg',
  toyota: '/images/brands/toyota.svg',
  volkswagen: '/images/brands/volkswagen.svg',
  volvo: '/images/brands/volvo.svg',
  vw: '/images/brands/volkswagen.svg',
}

function getBrandLogoPath(brand: string) {
  return BRAND_LOGO_PATHS[brand.trim().toLowerCase()] ?? null
}
function normalizeBrandValue(brand: string) {
  const normalized = normalizeValue(brand)

  if (normalized === 'mercedes' || normalized === 'mercedes-benz') {
    return 'mercedes-benz'
  }

  if (normalized === 'vw' || normalized === 'volkswagen') {
    return 'volkswagen'
  }

  return normalized
}

function getBrandDisplayName(brand: string) {
  switch (normalizeBrandValue(brand)) {
    case 'audi':
      return 'Audi'
    case 'bmw':
      return 'BMW'
    case 'mercedes-benz':
      return 'Mercedes-Benz'
    case 'volkswagen':
      return 'Volkswagen'
    default:
      return brand.trim()
  }
}
function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

function matchesServiceCategory(
  projectServiceId: string,
  selectedServiceId: string,
) {
  if (selectedServiceId === 'custom-steering-wheels') {
    return (
      projectServiceId === 'carbon-steering-wheels' ||
      projectServiceId === 'leather-steering-wheel-covers'
    )
  }

  return normalizeValue(projectServiceId) === normalizeValue(selectedServiceId)
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'ambient-lighting',
    title: 'Ambient Lighting',
    description: 'Atmospheric cabin lighting with tailored illumination.',
    icon: Sparkles,
  },
  {
    id: 'custom-steering-wheels',
    title: 'Custom Steering Wheels',
    description: 'Carbon, leather and Alcantara steering-wheel projects.',
    icon: BadgeCheck,
  },
  {
    id: 'starlight-headliner',
    title: 'Starlight Headliner',
    description: 'A custom star-map ceiling experience for the cabin.',
    icon: Star,
  },
  {
  id: 'screens-media',
  title: 'Screens & Media',
  description: 'Multimedia, infotainment and display upgrade projects.',
  icon: Camera,
},
{
    id: 'body-kit',
    title: 'Body Kit',
    description: 'Front lip, rear diffuser and rear spoiler in one package.',
    icon: Zap,
  },
]

function ProjectsPage() {
  const { service: requestedServiceId } = Route.useSearch()
  const [activeServiceId, setActiveServiceId] = useState<string | null>(
    () =>
      requestedServiceId &&
      serviceCategories.some(
        (service) => service.id === requestedServiceId,
      )
        ? requestedServiceId
        : null,
  )
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<ProjectGalleryItem | null>(null)
  const [galleryItems, setGalleryItems] = useState<ProjectGalleryItem[]>([])
  useEffect(() => {
    let isActive = true

    fetchProjects()
      .then((projects: ProjectRecord[]) => {
        const remoteItems: ProjectGalleryItem[] = projects.flatMap((project) =>
          project.media
            .filter((media: ProjectMedia) => media.mediaType === 'image')
            .map((media: ProjectMedia) => ({
              slug: project.slug,
              serviceId: project.serviceId,
              brand: project.brand,
              model: project.model,
              title: project.title,
              image: media.publicUrl,
            })),
        )

        if (isActive) {
          setGalleryItems(remoteItems)
        }
      })
      .catch((error) => {
        console.warn('Failed to load Supabase projects', error)
      })

    return () => {
      isActive = false
    }
  }, [])
    useEffect(() => {
    if (
      requestedServiceId &&
      serviceCategories.some(
        (service) => service.id === requestedServiceId,
      )
    ) {
      setActiveServiceId(requestedServiceId)
      setActiveBrand(null)
      setActiveModel(null)
    }
  }, [requestedServiceId])

  const selectedService = useMemo(
    () => serviceCategories.find((service) => service.id === activeServiceId) ?? null,
    [activeServiceId],
  )

  const availableBrands = useMemo(() => {
    if (!activeServiceId) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)

    return Array.from(new Set(galleryItems
      .filter((item) => matchesServiceCategory(item.serviceId, selectedServiceKey))
      .map((item) => getBrandDisplayName(item.brand))))
  }, [activeServiceId, galleryItems])

  const availableModels = useMemo(() => {
    if (!activeServiceId || !activeBrand) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)
    const selectedBrandKey = normalizeBrandValue(activeBrand)

    return Array.from(new Set(
      galleryItems
        .filter((item) => matchesServiceCategory(item.serviceId, selectedServiceKey) && normalizeBrandValue(item.brand) === selectedBrandKey)        .map((item) => item.model.trim()),
    ))
  }, [activeServiceId, activeBrand, galleryItems])

  const visibleProjects = useMemo(() => {
    if (!activeServiceId || !activeBrand || !activeModel) {
      return []
    }

    const selectedServiceKey = normalizeValue(activeServiceId)
    const selectedBrandKey = normalizeBrandValue(activeBrand)
    const selectedModelKey = normalizeValue(activeModel)

    return galleryItems.filter((item) => matchesServiceCategory(item.serviceId, selectedServiceKey) && normalizeBrandValue(item.brand) === selectedBrandKey && normalizeValue(item.model) === selectedModelKey)  }, [activeServiceId, activeBrand, activeModel, galleryItems])

  const showAdjacentGalleryImage = (direction: -1 | 1) => {
    setSelectedGalleryImage((currentImage) => {
      if (!currentImage || visibleProjects.length < 2) {
        return currentImage
      }

      const currentIndex = visibleProjects.indexOf(currentImage)
      const safeIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex =
        (safeIndex + direction + visibleProjects.length) %
        visibleProjects.length

      return visibleProjects[nextIndex]
    })
  }

  useEffect(() => {
    if (!selectedGalleryImage) {
      return
    }

    const handleLightboxKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedGalleryImage(null)
      } else if (event.key === 'ArrowLeft') {
        showAdjacentGalleryImage(-1)
      } else if (event.key === 'ArrowRight') {
        showAdjacentGalleryImage(1)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleLightboxKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleLightboxKeyDown)
    }
  }, [selectedGalleryImage, visibleProjects])
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
            <strong>{String(galleryItems.length).padStart(2, '0')}</strong>
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
                    <span className="project-choice-icon">
                      {getBrandLogoPath(brand) ? (
                        <img
                          className="project-brand-logo"
                          src={getAssetPath(getBrandLogoPath(brand) as string)}
                          alt={`${brand} logo`}
                        />
                      ) : (
                        <CarFront size={20} />
                      )}
                    </span>
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
                  <article
                    className={`project-card project-card-${(index % 5) + 1}`}
                    key={`${project.slug}-${index}`}
                    role="link"
                    tabIndex={0}
                    aria-label={`View the complete ${project.title} project`}
                    onClick={() => {
                      window.location.assign(
                        getAssetPath(`/project/${project.slug}`),
                      )
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        window.location.assign(
                          getAssetPath(`/project/${project.slug}`),
                        )
                      }
                    }}
                  >
                    <img src={getAssetPath(project.image)} alt={project.title} />
                    <div className="project-card-shade" />
                    <div className="project-card-topline">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span className="project-photo-status"><ArrowUpRight size={14} /> View project</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedGalleryImage ? (
        <div
          className="project-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Project photo viewer"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <button
            className="project-lightbox-close"
            type="button"
            aria-label="Close photo"
            onClick={() => setSelectedGalleryImage(null)}
          >
            ×
          </button>

          {visibleProjects.length > 1 ? (
            <>
              <button
                className="project-lightbox-nav project-lightbox-prev"
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showAdjacentGalleryImage(-1)
                }}
              >
                <ChevronLeft size={32} />
              </button>

              <button
                className="project-lightbox-nav project-lightbox-next"
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showAdjacentGalleryImage(1)
                }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          ) : null}

          <img
            src={getAssetPath(selectedGalleryImage.image)}
            alt={selectedGalleryImage.title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
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
