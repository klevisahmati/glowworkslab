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

export const Route = createFileRoute('/')({
  component: GlowworksPage,
})

const services = [
  {
    number: '01',
    title: 'Ambient Light',
    description:
      'OEM-style φωτισμός σε πόρτες, ταμπλό και κονσόλα με χρώματα και δυναμικά προγράμματα.',
    image: '/images/mercedes_glc_w205_coupe.jpg',
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'Custom Τιμόνι',
    description:
      'Δέρμα, Alcantara ή carbon look, custom ραφές και σχεδιασμός που ταιριάζει απόλυτα στο αυτοκίνητό σου.',
    image: '/images/custom-steering.webp',
    icon: LucideCircleGauge,
  },
  {
    number: '03',
    title: 'Αστέρια Οροφής',
    description:
      'Πάνω από 600 οπτικές ίνες, shooting stars και ατμόσφαιρα που αλλάζει όλο το εσωτερικό.',
    image: '/images/starlight-headliner.webp',
    icon: Sparkles,
  },
  {
    number: '04',
    title: 'Οθόνες & Media',
    description:
      'Οθόνες υψηλής ανάλυσης, σύγχρονο infotainment και καθαρή εργοστασιακή εφαρμογή στο ταμπλό.',
    image: '/images/android-display.webp',
    icon: MonitorPlay,
  },{
    number: '05',
    title: 'body kits & exterior upgrades',
    description:
      'Premium body kits κορυφαίας σχεδίασης και αεροδυναμικής. Χαρίστε στο αυτοκίνητό σας την απόλυτη πολυτελή σπορ εμφάνιση.',
    image: '/images/IMG_2085.JPEG',
    icon: CarFront,
  },
]

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

function GlowworksPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormStatus('sending')

    const form = event.currentTarget
    form.reset()
    setFormStatus('success')
  }

  const closeMenu = () => setMenuOpen(false)
  const heroBackgroundImage = getAssetPath('/images/mercedes_a_class_w1172.jpg')

  return (
<main id="top">
      <nav className={scrolled ? 'site-nav is-scrolled' : 'site-nav'}>
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Glowworks.lab αρχική" onClick={closeMenu}>
            <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
          </a>

          <div className={menuOpen ? 'nav-links is-open' : 'nav-links'}>
            <a href={getAssetPath('/portal')} onClick={closeMenu}>Portal</a>
            <a href={getAssetPath('/projects')} onClick={closeMenu}>Έργα</a>
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
            <p className="eyebrow"><span /> φωτισμός & custom αναβαθμίσεις αυτοκινήτων</p>
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
        <div className="section-index">01 / Επιλεγμένα έργα</div>
        <div className="intro-copy">
          <p className="eyebrow"><span /> Η δουλειά μας</p>
          <h2>Η λεπτομέρεια δεν είναι επιπλέον. Είναι η βάση.</h2>
        </div>
        <p className="intro-note">
          Κάθε εγκατάσταση σχεδιάζεται για το συγκεκριμένο όχημα, με καθαρό φινίρισμα και αισθητική που δείχνει εργοστασιακή.
        </p>
      </section>

      <section className="work-grid shell" aria-label="Έργα Glowworks.lab">
        {services.map((service, index) => (
          <article className={`work-card work-card-${index + 1}`} key={service.title}>
            <img src={service.image} alt={service.title} />
            <div className="work-shade" />
            <div className="work-card-content">
              <span>{service.number}</span>
              <h3>{service.title}</h3>
            </div>
            <ArrowUpRight className="work-arrow" size={23} />
          </article>
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
            {services.map((service) => {
              const Icon = service.icon
              return (
                <article className="service-row" key={service.title}>
                  <span className="service-number">{service.number}</span>
                  <div className="service-icon"><Icon size={23} strokeWidth={1.6} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ChevronRight className="service-arrow" size={22} />
                </article>
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
                  <label className="full">Όχημα *<input name="vehicle" type="text" required placeholder="Μάρκα, μοντέλο, έτος" /></label>
                  <label className="full">Υπηρεσία *
                    <select name="service" required defaultValue="">
                      <option value="" disabled>Επίλεξε υπηρεσία</option>
                      <option>Ambient Light</option>
                      <option>Custom Τιμόνι</option>
                      <option>Αστέρια Οροφής</option>
                      <option>Οθόνες & Media</option>
                      <option>Συνδυασμός υπηρεσιών</option>
                    </select>
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
