import { createFileRoute } from '@tanstack/react-router'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { useLanguage } from '../../lib/language'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjectBySlug, fetchProjects } from '../../lib/projects'
import type { ProjectMedia, ProjectRecord } from '../../types/projects'

function getAssetPath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedBase = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/')
    ? `${normalizedBase}${path}`
    : `${normalizedBase}/${path}`
}

function getServiceLabel(serviceId: string) {
  switch (serviceId) {
    case 'ambient-lighting':
      return 'Ambient Lighting'
    case 'carbon-steering-wheels':
    case 'leather-steering-wheel-covers':
    case 'custom-steering-wheels':
      return 'Custom Steering Wheel'
    case 'starlight-headliner':
      return 'Starlight Headliner'
    case 'screens-media':
      return 'Screens & Media'
    case 'body-kit':
      return 'Body Kit & Exterior'
    default:
      return serviceId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
  }
}

export const Route = createFileRoute('/project/$projectSlug')({
  loader: ({ params }) => fetchProjectBySlug(params.projectSlug),
  head: ({ loaderData, match }) => ({
    meta: [
      {
        title: loaderData
          ? `${match.context.initialLanguage === 'en' ? (loaderData.titleEn || loaderData.title) : loaderData.title} — Glowworks.lab`
          : match.context.initialLanguage === 'en'
            ? 'Project not found — Glowworks.lab'
            : 'Το έργο δεν βρέθηκε — Glowworks.lab',
      },
      {
        name: 'description',
        content: loaderData
          ? (
              match.context.initialLanguage === 'en'
                ? (loaderData.descriptionEn || loaderData.description)
                : loaderData.description
            ) || 'Premium automotive project by Glowworks.lab in Rhodes, Greece.'
          : match.context.initialLanguage === 'en'
            ? 'Explore premium automotive customisation projects by Glowworks.lab in Rhodes, Greece.'
            : 'Ανακάλυψε τις premium αναβαθμίσεις αυτοκινήτων της Glowworks.lab στη Ρόδο.',
      },
      ...(loaderData?.media[0]?.publicUrl
        ? [
            {
              property: 'og:image',
              content: loaderData.media[0].publicUrl,
            },
          ]
        : []),
    ],
  }),
  component: IndividualProjectPage,
})

function IndividualProjectPage() {
  const { language } = useLanguage()
  const project = Route.useLoaderData()
  const [activeMedia, setActiveMedia] = useState<ProjectMedia | null>(null)
  const [relatedProjects, setRelatedProjects] = useState<ProjectRecord[]>([])

  const imageMedia = useMemo(
    () =>
      project?.media.filter((media) => media.mediaType === 'image') ?? [],
    [project],
  )

  const cover =
    imageMedia.find((media) => media.isCover) ??
    imageMedia[0] ??
    null
  const bookingUrl = project
    ? getAssetPath(
        `/?project=${encodeURIComponent(project.title)}` +
          `&service=${encodeURIComponent(
            getServiceLabel(project.serviceId),
          )}` +
          `&brand=${encodeURIComponent(project.brand)}` +
          `&model=${encodeURIComponent(project.model)}` +
          '#booking',
      )
    : getAssetPath('/#booking')

  const showAdjacentImage = (direction: -1 | 1) => {
    setActiveMedia((current) => {
      if (!current || imageMedia.length < 2) {
        return current
      }

      const currentIndex = imageMedia.findIndex(
        (media) => media.id === current.id,
      )
      const safeIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex =
        (safeIndex + direction + imageMedia.length) %
        imageMedia.length

      return imageMedia[nextIndex]
    })
  }

  useEffect(() => {
    if (!project) {
      setRelatedProjects([])
      return
    }

    let isActive = true

    fetchProjects()
      .then((projects) => {
        const rankedProjects = projects
          .filter((candidate) => candidate.id !== project.id)
          .map((candidate) => ({
            project: candidate,
            score:
              (candidate.serviceId === project.serviceId ? 2 : 0) +
              (candidate.brand.trim().toLowerCase() ===
              project.brand.trim().toLowerCase()
                ? 1
                : 0),
          }))
          .filter((candidate) => candidate.score > 0)
          .sort((first, second) => second.score - first.score)
          .slice(0, 3)
          .map((candidate) => candidate.project)

        if (isActive) {
          setRelatedProjects(rankedProjects)
        }
      })
      .catch((error) => {
        console.warn('Failed to load related projects', error)
      })

    return () => {
      isActive = false
    }
  }, [project])
  useEffect(() => {
    if (!activeMedia) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMedia(null)
      } else if (event.key === 'ArrowLeft') {
        showAdjacentImage(-1)
      } else if (event.key === 'ArrowRight') {
        showAdjacentImage(1)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeMedia, imageMedia])

  if (!project) {
    return (
      <main className="project-detail-page">
        <nav className="project-detail-nav">
          <a href={getAssetPath('/')}>
            <img
              src={getAssetPath('/images/glowworks-logo.webp')}
              alt="Glowworks.lab"
            />
          </a>
        </nav>

        <section className="project-not-found">
          <p className="eyebrow"><span /> Glowworks archive</p>
          <h1>{language === 'en' ? 'Project not found.' : 'Το project δεν βρέθηκε.'}</h1>
          <p>
            {language === 'en' ? 'This project may have been moved or is no longer available.' : 'Αυτό το project μπορεί να έχει μετακινηθεί ή να μην είναι πλέον διαθέσιμο.'}
          </p>
          <a className="button button-primary" href={getAssetPath('/projects')}>
            <ArrowLeft size={16} /> {language === 'en' ? 'View all projects' : 'Όλα τα projects'}
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="project-detail-page">
      <nav className="project-detail-nav">
        <a
          className="project-detail-brand"
          href={getAssetPath('/')}
          aria-label={language === 'en' ? 'Glowworks.lab homepage' : 'Αρχική σελίδα Glowworks.lab'}
        >
          <img
            src={getAssetPath('/images/glowworks-logo.webp')}
            alt="Glowworks.lab"
          />
        </a>

        <div className="project-detail-nav-actions"><LanguageSwitcher />
          <a href={getAssetPath('/projects')}>
            <ArrowLeft size={16} /> Projects
          </a>
          <a
            className="project-detail-book"
            href={bookingUrl}
          >
            {language === 'en' ? 'Book an appointment' : 'Κλείσε ραντεβού'} <ArrowUpRight size={16} />
          </a>
        </div>
      </nav>

      <header className="project-detail-hero">
        {cover ? (
          <img
            className="project-detail-hero-image"
            src={cover.publicUrl}
            alt={cover.altText || project.title}
          />
        ) : null}
        <div className="project-detail-hero-overlay" />

        <div className="project-detail-hero-content">
          <p className="project-detail-index">
            Glowworks.lab / Project archive
          </p>

          <div className="project-detail-tags">
            <span>{getServiceLabel(project.serviceId)}</span>
            <span>{project.brand}</span>
            <span>{project.model}</span>
          </div>

          <h1>{language === 'en' ? project.titleEn?.trim() || project.title : project.title}</h1>

          <a
            className="project-detail-scroll"
            href="#project-story"
          >
            {language === 'en' ? 'Explore the project' : 'Ανακάλυψε το project'} <ArrowUpRight size={17} />
          </a>
        </div>
      </header>

      <section
        className="project-detail-story"
        id="project-story"
      >
        <div className="project-detail-story-heading">
          <p className="eyebrow"><span /> {language === 'en' ? 'The transformation' : 'Η μεταμόρφωση'}</p>
          <h2>{language === 'en' ? 'Designed around' : 'Σχεδιασμένο για'}<br />{language === 'en' ? 'the vehicle.' : 'το αυτοκίνητό σου.'}</h2>
        </div>

        <div className="project-detail-story-copy">
          <p>{language === 'en' ? project.descriptionEn?.trim() || project.description : project.description}</p>

          <div className="project-detail-features">
            <span><Check size={17} /> {language === 'en' ? 'Tailored vehicle integration' : 'Εξατομικευμένη εφαρμογή στο όχημα'}</span>
            <span><Check size={17} /> {language === 'en' ? 'Premium installation finish' : 'Προσεγμένο αποτέλεσμα εγκατάστασης'}</span>
            <span><Check size={17} /> {language === 'en' ? 'Glowworks.lab quality control' : 'Έλεγχος ποιότητας Glowworks.lab'}</span>
          </div>
        </div>
      </section>

      {imageMedia.length ? (
        <section className="project-detail-gallery">
          <div className="project-detail-section-title">
            <p className="eyebrow"><span /> {language === 'en' ? 'Project gallery' : 'Φωτογραφίες project'}</p>
            <strong>
              {String(imageMedia.length).padStart(2, '0')} {language === 'en' ? 'images' : 'φωτογραφίες'}
            </strong>
          </div>

          <div className="project-detail-gallery-grid">
            {imageMedia.map((media, index) => (
              <button
                className={`project-detail-gallery-item ${
                  index === 0 ? 'project-detail-gallery-featured' : ''
                }`}
                type="button"
                key={media.id}
                onClick={() => setActiveMedia(media)}
                aria-label={`Open project photo ${index + 1}`}
              >
                <img
                  src={media.publicUrl}
                  alt={
                    media.altText ||
                    `${project.title} photo ${index + 1}`
                  }
                />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {relatedProjects.length ? (
        <section className="project-detail-related">
          <div className="project-detail-section-title">
            <p className="eyebrow"><span /> {language === 'en' ? 'Continue exploring' : 'Συνέχισε την εξερεύνηση'}</p>
            <strong>{language === 'en' ? 'Related projects' : 'Σχετικά projects'}</strong>
          </div>

          <div className="project-detail-related-grid">
            {relatedProjects.map((relatedProject) => {
              const relatedCover =
                relatedProject.media.find((media) => media.isCover) ??
                relatedProject.media.find(
                  (media) => media.mediaType === 'image',
                ) ??
                null

              return (
                <a
                  className="project-detail-related-card"
                  href={getAssetPath(
                    `/project/${relatedProject.slug}`,
                  )}
                  key={relatedProject.id}
                >
                  {relatedCover ? (
                    <img
                      src={relatedCover.publicUrl}
                      alt={
                        relatedCover.altText ||
                        relatedProject.title
                      }
                    />
                  ) : (
                    <div className="project-detail-related-placeholder" />
                  )}

                  <div className="project-detail-related-overlay" />

                  <div className="project-detail-related-copy">
                    <span>
                      {relatedProject.brand} / {relatedProject.model}
                    </span>
                    <h3>{language === 'en' ? relatedProject.titleEn?.trim() || relatedProject.title : relatedProject.title}</h3>
                    <strong>
                      {language === 'en' ? 'View project' : 'Δες το project'} <ArrowUpRight size={16} />
                    </strong>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}
      <section className="project-detail-cta">
        <div>
          <p className="eyebrow"><span /> {language === 'en' ? 'Your vehicle, next' : 'Το δικό σου αυτοκίνητο είναι το επόμενο'}</p>
          <h2>{language === 'en' ? 'Ready for your own transformation?' : 'Έτοιμος για τη δική σου αναβάθμιση;'}</h2>
          <p>
            {language === 'en' ? 'Tell us your vehicle and the upgrade you have in mind.' : 'Πες μας ποιο αυτοκίνητο έχεις και τι αναβάθμιση θέλεις.'}
            {language === 'en' ? 'We will design the right solution for you.' : 'Θα σχεδιάσουμε τη σωστή λύση για εσένα.'}
          </p>
        </div>

        <a
          className="button button-primary"
          href={bookingUrl}
        >
          {language === 'en' ? 'Book an appointment' : 'Κλείσε ραντεβού'} <ArrowUpRight size={17} />
        </a>
      </section>

      <footer className="project-detail-footer">
        <img
          src={getAssetPath('/images/glowworks-logo.webp')}
          alt="Glowworks.lab"
        />
        <p>{language === 'en' ? 'Premium automotive upgrades — Rhodes, Greece' : 'Premium αναβαθμίσεις αυτοκινήτων — Ρόδος, Ελλάδα'}</p>
      </footer>

      {activeMedia ? (
        <div
          className="project-detail-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Project photo viewer"
          onClick={() => setActiveMedia(null)}
        >
          <button
            className="project-detail-lightbox-close"
            type="button"
            aria-label="Close photo"
            onClick={() => setActiveMedia(null)}
          >
            <X size={25} />
          </button>

          {imageMedia.length > 1 ? (
            <>
              <button
                className="project-detail-lightbox-nav project-detail-lightbox-prev"
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showAdjacentImage(-1)
                }}
              >
                <ChevronLeft size={32} />
              </button>

              <button
                className="project-detail-lightbox-nav project-detail-lightbox-next"
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation()
                  showAdjacentImage(1)
                }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          ) : null}

          <img
            src={activeMedia.publicUrl}
            alt={activeMedia.altText || project.title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </main>
  )
}