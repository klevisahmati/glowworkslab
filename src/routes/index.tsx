import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleGauge,
  Clock3,
  Instagram,
  Lightbulb,
  LucideCircleGauge,
  Menu,
  MonitorPlay,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { getPortalState } from '../lib/portal-session'
import { DEFAULT_WEBSITE_CONTENT, SERVICE_SEARCH_ALIASES, type PublicService, type WebsiteContent } from '../lib/site-content'

export const Route = createFileRoute('/')({
  component: GlowworksPage,
})

const steps = [
  ['01', 'Στείλε αίτημα', 'Μας λες το όχημα και την αναβάθμιση που θέλεις.'],
  ['02', 'Μιλάμε μαζί', 'Επιβεβαιώνουμε συμβατότητα, επιλογές, κόστος και χρόνο.'],
  ['03', 'Το δημιουργούμε', 'Η εγκατάσταση γίνεται μεθοδικά στον χώρο μας στη Ρόδο.'],
  ['04', 'Ζήσε τη διαφορά', 'Παραλαμβάνεις ένα εσωτερικό σχεδιασμένο για σένα.'],
]

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

function getAssetPath(path: string) {
  const normalizedBase = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/') ? `${normalizedBase}${path}` : `${normalizedBase}/${path}`
}

function resolveServiceId(value: string) {
  const normalized = value.trim().toLowerCase()
  return SERVICE_SEARCH_ALIASES[normalized] ?? null
}

function getServiceIcon(serviceId: string) {
  switch (serviceId) {
    case 'ambient-lighting':
      return Lightbulb
    case 'carbon-steering-wheels':
      return LucideCircleGauge
    case 'starlight-headliner':
      return Sparkles
    case 'screens-media':
      return MonitorPlay
    default:
      return CarFront
  }
}

function GlowworksPage() {
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(DEFAULT_WEBSITE_CONTENT)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState('')
  const [selectedVehicleModel, setSelectedVehicleModel] = useState('')
  const [selectedVehicleYear, setSelectedVehicleYear] = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleModelSearch, setVehicleModelSearch] = useState('')
  const [vehicleYearSearch, setVehicleYearSearch] = useState('')
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false)
  const [isVehicleModelDropdownOpen, setIsVehicleModelDropdownOpen] = useState(false)
  const [isVehicleYearDropdownOpen, setIsVehicleYearDropdownOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const loaded = getPortalState().websiteContent
    if (loaded) {
      setWebsiteContent(loaded)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormStatus('sending')

    const form = event.currentTarget
    form.reset()
    setSelectedVehicleBrand('')
    setSelectedVehicleModel('')
    setSelectedVehicleYear('')
    setSelectedService('')
    setVehicleSearch('')
    setVehicleModelSearch('')
    setVehicleYearSearch('')
    setServiceSearch('')
    setFormStatus('success')
  }

  const closeMenu = () => setMenuOpen(false)
  const serviceCards = websiteContent.services.length ? websiteContent.services : DEFAULT_WEBSITE_CONTENT.services
  const vehicleBrandModels = websiteContent.vehicleBrandModels
  const vehicleBrands = Object.keys(vehicleBrandModels).sort()
  const serviceOptions = [...new Set([...serviceCards.map((service) => service.title), 'Συνδυασμός υπηρεσιών'])]
  const heroBackgroundImage = getAssetPath(websiteContent.heroImage || DEFAULT_WEBSITE_CONTENT.heroImage)
  const filteredVehicleBrands = vehicleBrands.filter((brand) => {
    const query = vehicleSearch.trim().toLowerCase()
    if (!query) {
      return true
    }
    return brand.toLowerCase().includes(query)
  })

  const filteredVehicleModels = (selectedVehicleBrand ? vehicleBrandModels[selectedVehicleBrand] || [] : []).filter((model) => {
    const query = vehicleModelSearch.trim().toLowerCase()
    if (!query) {
      return true
    }
    return model.toLowerCase().includes(query)
  })

  const yearOptions = Array.from({ length: 40 }, (_, index) => new Date().getFullYear() - index)
  const filteredVehicleYears = yearOptions.filter((year) => {
    const query = vehicleYearSearch.trim().toLowerCase()
    if (!query) {
      return true
    }
    return String(year).includes(query)
  })

  const filteredServices = serviceOptions.filter((service) => {
    const query = serviceSearch.trim().toLowerCase()
    if (!query) {
      return true
    }
    return service.toLowerCase().includes(query)
  })

  const selectedOrTypedService = selectedService || serviceSearch
  const relatedServiceId = resolveServiceId(selectedOrTypedService)
  const relatedProjectsPath = relatedServiceId
    ? getAssetPath(`/projects?service=${encodeURIComponent(relatedServiceId)}`)
    : null

  return (
<main id="top">
      <nav className={scrolled ? 'site-nav is-scrolled' : 'site-nav'}>
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Glowworks.lab αρχική" onClick={closeMenu}>
            <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
          </a>

          <div className={menuOpen ? 'nav-links is-open' : 'nav-links'}>
            <a href={getAssetPath('/portal/login')} onClick={closeMenu}>Portal</a>
            <a href={getAssetPath('/projects')} onClick={closeMenu}>Projects</a>
            <a href="#services" onClick={closeMenu}>Υπηρεσίες</a>
            <a href="#process" onClick={closeMenu}>Διαδικασία</a>
            <a className="nav-book" href="#booking" onClick={closeMenu}>
              Κλείστε ραντεβού <ArrowUpRight size={15} />
            </a>
          </div>

          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-image" aria-hidden="true" style={{ backgroundImage: `url('${heroBackgroundImage}')` }} />
        <div className="hero-grid" aria-hidden="true" />
        <div className="shell hero-content">
          <div className="hero-copy reveal">
            <p className="eyebrow"><span /> automovive lighting & customization <span /></p>
            <h1>
              Άλλαξε την
              <span>ατμόσφαιρα.</span>
            </h1>
            <p className="hero-lead">
              Custom φωτισμός, τιμόνια, starlight οροφές και media upgrades που κάνουν το εσωτερικό σου πραγματικά δικό σου.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#booking">
                Κλείσε ραντεβού <ArrowDownRight size={19} />
              </a>
              <a className="button button-secondary" href={getAssetPath('/projects')}>Δες όλα τα projects</a>
            </div>
          </div>

          <div className="hero-card reveal reveal-delay">
            <span className="hero-card-label">Glowworks.lab</span>
            <div className="hero-card-mark"><Sparkles size={29} /></div>
            <p>Σχεδιασμένο γύρω από το δικό σου ταξίδι.</p>
            <div className="hero-card-meta">
              <span>Custom εσωτερικά</span>
              <span>Βάση τη Ρόδο</span>
            </div>
          </div>

          <a className="scroll-cue" href="#work" aria-label="Μετάβαση στη δουλειά μας">
            <span>Scroll to explore</span><ArrowDownRight size={18} />
          </a>
        </div>
      </header>

      <section className="intro shell" id="work">
        <div className="section-index">01 / Selected Projects</div>
        <div className="intro-copy">
          <p className="eyebrow"><span /> Η δουλειά μας</p>
          <h2>Η λεπτομέρεια δεν είναι επιπλέον. Είναι η βάση.</h2>
        </div>
        <p className="intro-note">
          Κάθε εγκατάσταση σχεδιάζεται για το συγκεκριμένο όχημα, με καθαρό φινίρισμα και αισθητική που δείχνει εργοστασιακή.
        </p>
      </section>

      <section className="work-grid shell" aria-label="Projects Glowworks.lab">
        {serviceCards.map((service, index) => (
          <a
            className={`work-card work-card-${index + 1}`}
            key={service.title}
            href={getAssetPath(`/projects?service=${encodeURIComponent(service.id)}`)}
          >
            <img src={service.image} alt={service.title} />
            <div className="work-shade" />
            <div className="work-card-content">
              <span>{service.number}</span>
              <h3>{service.title}</h3>
            </div>
            <ArrowUpRight className="work-arrow" size={23} />
          </a>
        ))}
      </section>

      <section className="services-section" id="services">
        <div className="shell">
          <div className="section-index light">02 / Τι κάνουμε</div>
          <div className="services-heading">
            <div>
              <p className="eyebrow"><span /> Υπηρεσίες</p>
              <h2>Σχεδιασμένο για τη δική σου διαδρομή.</h2>
            </div>
            <p>Πέντε τρόποι να μεταμορφώσεις το σημείο όπου περνάς κάθε χιλιόμετρο.</p>
          </div>

          <div className="service-list">
            {serviceCards.map((service) => {
              const Icon = getServiceIcon(service.id)
              return (
                <a
                  className="service-row"
                  key={service.title}
                  href={getAssetPath(`/projects?service=${encodeURIComponent(service.id)}`)}
                >
                  <span className="service-number">{service.number}</span>
                  <div className="service-icon"><Icon size={23} strokeWidth={1.6} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ChevronRight className="service-arrow" size={22} />
                </a>
              )
            })}
          </div>

          <div className="trust-bar">
            <span><ShieldCheck size={21} /> 2 χρόνια εγγύηση</span>
            <span><CircleGauge size={21} /> Επαγγελματική εγκατάσταση</span>
            <span><Sparkles size={21} /> Υλικά υψηλής ποιότητας</span>
          </div>
        </div>
      </section>

      <section className="process-section shell" id="process">
        <div className="section-index">03 / Διαδικασία</div>
        <div className="process-layout">
          <div className="process-title">
            <p className="eyebrow"><span /> Η διαδικασία</p>
            <h2>Από την ιδέα στην εγκατάσταση.</h2>
            <p>Καθαρά βήματα, ξεκάθαρη επικοινωνία και αποτέλεσμα χωρίς εκπλήξεις.</p>
          </div>
          <div className="steps">
            {steps.map(([number, title, description]) => (
              <article className="step" key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="booking-bloom" aria-hidden="true" />
        <div className="shell booking-layout">
          <div className="booking-copy">
            <div className="section-index light">04 / Ραντεβού</div>
            <p className="eyebrow"><span /> Κράτηση</p>
            <h2>Πες μας τι θέλεις να αλλάξεις.</h2>
            <p>Συμπλήρωσε τα στοιχεία σου και θα επικοινωνήσουμε μαζί σου για επιλογές, διαθεσιμότητα και προσφορά.</p>
            <div className="contact-list">
              <a href="tel:+306937153914"><Phone size={19} /> <span><small>Κλήση / SMS</small>693 715 3914</span></a>
              <a href="https://www.instagram.com/glowworks.lab/" target="_blank" rel="noreferrer"><Instagram size={19} /> <span><small>Instagram</small>@glowworks.lab</span></a>
            </div>
          </div>

          <div className="booking-card">
            {formStatus === 'success' ? (
              <div className="success-state" role="status">
                <div><Check size={30} /></div>
                <p className="eyebrow"><span /> Το λάβαμε</p>
                <h3>Το αίτημα στάλθηκε.</h3>
                <p>Επικοινωνούμε μαζί σου το συντομότερο για να οργανώσουμε την αναβάθμιση.</p>
                <button type="button" className="button button-secondary" onClick={() => setFormStatus('idle')}>Νέο αίτημα</button>
              </div>
            ) : (
              <form
                name="glowworks-appointment"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="form-name" value="glowworks-appointment" />
                <p className="hidden-field"><label>Μην το συμπληρώσετε: <input name="bot-field" /></label></p>

                <div className="form-grid">
                  <label>Όνομα *<input name="name" type="text" autoComplete="name" required placeholder="Το όνομά σου" /></label>
                  <label>Τηλέφωνο *<input name="phone" type="tel" autoComplete="tel" required placeholder="69x xxx xxxx" /></label>
                  <label className="full">Όχημα *
                    <div className="vehicle-selector">
                      <input type="hidden" name="vehicle" value={selectedVehicleBrand ? `${selectedVehicleBrand}${selectedVehicleModel ? ` ${selectedVehicleModel}` : ''}${selectedVehicleYear ? ` ${selectedVehicleYear}` : ''}` : ''} required />
                      <div className="vehicle-search-wrap">
                        <input
                          type="text"
                          value={vehicleSearch || selectedVehicleBrand}
                          onChange={(event) => {
                            setVehicleSearch(event.target.value)
                            setSelectedVehicleBrand('')
                            setSelectedVehicleModel('')
                            setSelectedVehicleYear('')
                            setVehicleModelSearch('')
                            setIsVehicleDropdownOpen(true)
                            setIsVehicleModelDropdownOpen(false)
                          }}
                          onFocus={() => setIsVehicleDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsVehicleDropdownOpen(false), 120)}
                          placeholder="Μάρκα"
                        />
                        {isVehicleDropdownOpen ? (
                          <div className="vehicle-dropdown">
                            {filteredVehicleBrands.length > 0 ? (
                              filteredVehicleBrands.map((brand) => (
                                <button
                                  key={brand}
                                  type="button"
                                  className="vehicle-dropdown-option"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSelectedVehicleBrand(brand)
                                    setVehicleSearch(brand)
                                    setSelectedVehicleModel('')
                                    setSelectedVehicleYear('')
                                    setVehicleModelSearch('')
                                    setIsVehicleDropdownOpen(false)
                                    setIsVehicleModelDropdownOpen(true)
                                  }}
                                >
                                  {brand}
                                </button>
                              ))
                            ) : (
                              <div className="vehicle-dropdown-empty">Δεν βρέθηκε η μάρκα σου. Μπορείς να γράψεις τη δική σου.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {selectedVehicleBrand ? (
                        <div className="vehicle-search-wrap vehicle-search-wrap--secondary">
                          <input
                            type="text"
                            value={vehicleModelSearch || selectedVehicleModel}
                            onChange={(event) => {
                              setVehicleModelSearch(event.target.value)
                              setSelectedVehicleModel('')
                              setIsVehicleModelDropdownOpen(true)
                            }}
                            onFocus={() => setIsVehicleModelDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsVehicleModelDropdownOpen(false), 120)}
                            placeholder="Μοντέλο"
                          />
                          {isVehicleModelDropdownOpen ? (
                            <div className="vehicle-dropdown">
                              {filteredVehicleModels.length > 0 ? (
                                filteredVehicleModels.map((model) => (
                                  <button
                                    key={model}
                                    type="button"
                                    className="vehicle-dropdown-option"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setSelectedVehicleModel(model)
                                      setVehicleModelSearch(model)
                                      setIsVehicleModelDropdownOpen(false)
                                    }}
                                  >
                                    {model}
                                  </button>
                                ))
                              ) : (
                                <div className="vehicle-dropdown-empty">Δεν βρέθηκε μοντέλο για αυτή τη μάρκα.</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {selectedVehicleBrand ? (
                        <div className="vehicle-search-wrap vehicle-search-wrap--secondary">
                          <input type="hidden" name="year" value={selectedVehicleYear} required />
                          <input
                            type="text"
                            value={vehicleYearSearch || selectedVehicleYear}
                            onChange={(event) => {
                              setVehicleYearSearch(event.target.value)
                              setSelectedVehicleYear('')
                              setIsVehicleYearDropdownOpen(true)
                            }}
                            onFocus={() => setIsVehicleYearDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsVehicleYearDropdownOpen(false), 120)}
                            placeholder="Έτος"
                          />
                          {isVehicleYearDropdownOpen ? (
                            <div className="vehicle-dropdown">
                              {filteredVehicleYears.length > 0 ? (
                                filteredVehicleYears.map((year) => (
                                  <button
                                    key={year}
                                    type="button"
                                    className="vehicle-dropdown-option"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setSelectedVehicleYear(String(year))
                                      setVehicleYearSearch(String(year))
                                      setIsVehicleYearDropdownOpen(false)
                                    }}
                                  >
                                    {year}
                                  </button>
                                ))
                              ) : (
                                <div className="vehicle-dropdown-empty">Δεν βρέθηκε έτος.</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className="full">Υπηρεσία *
                    <div className="vehicle-selector">
                      <input type="hidden" name="service" value={selectedService} required />
                      <div className="vehicle-search-wrap">
                        <input
                          type="text"
                          value={serviceSearch || selectedService}
                          onChange={(event) => {
                            setServiceSearch(event.target.value)
                            setSelectedService('')
                            setIsServiceDropdownOpen(true)
                          }}
                          onFocus={() => setIsServiceDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsServiceDropdownOpen(false), 120)}
                          placeholder="Πληκτρολόγησε υπηρεσία ή διάλεξε"
                        />
                        {isServiceDropdownOpen ? (
                          <div className="vehicle-dropdown">
                            {filteredServices.length > 0 ? (
                              filteredServices.map((service) => (
                                <button
                                  key={service}
                                  type="button"
                                  className="vehicle-dropdown-option"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSelectedService(service)
                                    setServiceSearch(service)
                                    setIsServiceDropdownOpen(false)
                                    const matchedServiceId = resolveServiceId(service)
                                    if (matchedServiceId) {
                                      window.location.href = getAssetPath(`/projects?service=${encodeURIComponent(matchedServiceId)}`)
                                    }
                                  }}
                                >
                                  {service}
                                </button>
                              ))
                            ) : (
                              <div className="vehicle-dropdown-empty">Δεν βρέθηκε υπηρεσία.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {relatedProjectsPath ? (
                        <a className="button button-secondary" href={relatedProjectsPath}>
                          Δες σχετικά projects <ArrowUpRight size={16} />
                        </a>
                      ) : null}
                    </div>
                  </label>
                  <label><CalendarDays size={16} /> Προτιμώμενη ημερομηνία<input name="date" type="date" /></label>
                  <label><Clock3 size={16} /> Ώρα
                    <select name="time" defaultValue="Οποιαδήποτε">
                      <option>Οποιαδήποτε</option><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option>
                    </select>
                  </label>
                  <label className="full">Σχόλια<textarea name="message" rows={4} placeholder="Πες μας περισσότερα για αυτό που έχεις στο μυαλό σου…" /></label>
                </div>

                {formStatus === 'error' && <p className="form-error" role="alert">Κάτι πήγε στραβά. Δοκίμασε ξανά ή κάλεσέ μας απευθείας.</p>}
                <button className="submit-button" type="submit" disabled={formStatus === 'sending'}>
                  {formStatus === 'sending' ? 'Αποστολή…' : 'Στείλε αίτημα'} <ArrowUpRight size={19} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-main">
          <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" />
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
