import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjectBySlug } from '../../lib/projects'
import type { ProjectMedia } from '../../types/projects'

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
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.title} — Glowworks.lab`
          : 'Project not found — Glowworks.lab',
      },
      {
        name: 'description',
        content:
          loaderData?.description ||
          'Premium automotive project by Glowworks.lab in Rhodes, Greece.',
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
  const project = Route.useLoaderData()
  const [activeMedia, setActiveMedia] = useState<ProjectMedia | null>(null)

  const imageMedia = useMemo(
    () =>
      project?.media.filter((media) => media.mediaType === 'image') ?? [],
    [project],
  )

  const cover =
    imageMedia.find((media) => media.isCover) ??
    imageMedia[0] ??
    null

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
          <h1>Project not found.</h1>
          <p>
            This project may have been moved or is no longer available.
          </p>
          <a className="button button-primary" href={getAssetPath('/projects')}>
            <ArrowLeft size={16} /> View all projects
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
          aria-label="Glowworks.lab homepage"
        >
          <img
            src={getAssetPath('/images/glowworks-logo.webp')}
            alt="Glowworks.lab"
          />
        </a>

        <div className="project-detail-nav-actions">
          <a href={getAssetPath('/projects')}>
            <ArrowLeft size={16} /> Projects
          </a>
          <a
            className="project-detail-book"
            href={getAssetPath('/#booking')}
          >
            Κλείσε ραντεβού <ArrowUpRight size={16} />
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

          <h1>{project.title}</h1>

          <a
            className="project-detail-scroll"
            href="#project-story"
          >
            Explore the project <ArrowUpRight size={17} />
          </a>
        </div>
      </header>

      <section
        className="project-detail-story"
        id="project-story"
      >
        <div className="project-detail-story-heading">
          <p className="eyebrow"><span /> The transformation</p>
          <h2>Designed around<br />the vehicle.</h2>
        </div>

        <div className="project-detail-story-copy">
          <p>{project.description}</p>

          <div className="project-detail-features">
            <span><Check size={17} /> Tailored vehicle integration</span>
            <span><Check size={17} /> Premium installation finish</span>
            <span><Check size={17} /> Glowworks.lab quality control</span>
          </div>
        </div>
      </section>

      {imageMedia.length ? (
        <section className="project-detail-gallery">
          <div className="project-detail-section-title">
            <p className="eyebrow"><span /> Project gallery</p>
            <strong>
              {String(imageMedia.length).padStart(2, '0')} images
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

      <section className="project-detail-cta">
        <div>
          <p className="eyebrow"><span /> Your vehicle, next</p>
          <h2>Ready for your own transformation?</h2>
          <p>
            Tell us your vehicle and the upgrade you have in mind.
            We will design the right solution for you.
          </p>
        </div>

        <a
          className="button button-primary"
          href={getAssetPath('/#booking')}
        >
          Κλείσε ραντεβού <ArrowUpRight size={17} />
        </a>
      </section>

      <footer className="project-detail-footer">
        <img
          src={getAssetPath('/images/glowworks-logo.webp')}
          alt="Glowworks.lab"
        />
        <p>Premium automotive upgrades — Rhodes, Greece</p>
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