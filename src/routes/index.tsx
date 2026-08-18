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
  MapPin,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchHomepageImages,
  type HomepageImageRecord,
  type HomepageImageSlot,
} from '../lib/homepage-images'

export const Route = createFileRoute('/')({
  component: GlowworksPage,
})

const services = [
   {
    number: '01',
    projectServiceId: 'ambient-lighting',
    title: 'Ambient Light',
    description:
      'OEM-style φωτισμός σε πόρτες, ταμπλό και κονσόλα με χρώματα και δυναμικά προγράμματα.',
    imageSlot: 'ambient-lighting',
    image: '/images/mercedes_glc_w205_coupe.jpg',
    icon: Lightbulb,
  },
  {
    number: '02',
    projectServiceId: 'custom-steering-wheels',
    title: 'Custom Τιμόνι',
    description:
      'Δέρμα, Alcantara ή carbon look, custom ραφές και σχεδιασμός που ταιριάζει απόλυτα στο αυτοκίνητό σου.',
    imageSlot: 'custom-steering',
    image: '/images/custom-steering.webp',
    icon: LucideCircleGauge,
  },
  {
    number: '03',
    projectServiceId: 'starlight-headliner',
    title: 'Αστέρια Οροφής',
    description:
      'Πάνω από 600 οπτικές ίνες, shooting stars και ατμόσφαιρα που αλλάζει όλο το εσωτερικό.',
    imageSlot: 'starlight-headliner',
    image: '/images/starlight-headliner.webp',
    icon: Sparkles,
  },
  {
    number: '04',
    projectServiceId: 'screens-media',
    title: 'Οθόνες & Media',
    description:
      'Οθόνες υψηλής ανάλυσης, σύγχρονο infotainment και καθαρή εργοστασιακή εφαρμογή στο ταμπλό.',
    imageSlot: 'android-display',
    image: '/images/android-display.webp',
    icon: MonitorPlay,
  },
  {
    number: '05',
    projectServiceId: 'body-kit',
    title: 'Body Kits & Exterior Upgrades',
    description:
      'Premium body kits κορυφαίας σχεδίασης και αεροδυναμικής. Χαρίστε στο αυτοκίνητό σας την απόλυτη πολυτελή σπορ εμφάνιση.',
    imageSlot: 'body-kit',
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

const vehicleBrands = [
  'Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Bugatti','Buick','Cadillac','Chevrolet','Chrysler',
  'Citroën','Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep','Kia',
  'Lamborghini','Land Rover','Lexus','Lincoln','Lotus','Maserati','Mazda','McLaren','Mercedes-Benz','Mini','Mitsubishi',
  'Nissan','Opel','Peugeot','Porsche','Ram','Renault','Rolls-Royce','Saab','Seat','Skoda','Smart','Subaru','Suzuki',
  'Tesla','Toyota','Volkswagen','Volvo','Alpine','BYD','MG','Polestar','Rivian','Vauxhall','Other'
]

const serviceOptions = [
  'Ambient Light',
  'Custom Τιμόνι',
  'Αστέρια Οροφής',
  'Οθόνες & Media',
  'Συνδυασμός υπηρεσιών',
  'Body Kits & Exterior Upgrades',
]

const vehicleModels: Record<string, string[]> = {
  Acura: ['ILX', 'MDX', 'NSX', 'RDX', 'TLX', 'Other'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', 'Other'],
  'Aston Martin': ['DB11', 'DBX', 'Vantage', 'Other'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'R8', 'RS', 'TT', 'Other'],
  Bentley: ['Bentayga', 'Continental', 'Flying Spur', 'Other'],
  BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'iX', 'M Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'Other'],
  Bugatti: ['Chiron', 'Divo', 'Veyron', 'Other'],
  Buick: ['Enclave', 'Encore', 'Envision', 'LaCrosse', 'Regal', 'Other'],
  Cadillac: ['ATS', 'CT4', 'CT5', 'CT6', 'Escalade', 'XT4', 'XT5', 'XT6', 'Other'],
  Chevrolet: ['Camaro', 'Corvette', 'Cruze', 'Equinox', 'Malibu', 'Silverado', 'Spark', 'Suburban', 'Tahoe', 'Traverse', 'Volt', 'Other'],
  Chrysler: ['300', 'Pacifica', 'Voyager', 'PT Cruiser', 'Other'],
  Citroën: ['C3', 'C4', 'C5', 'Berlingo', 'Jumpy', 'Other'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Journey', 'Viper', 'Other'],
  Ferrari: ['488', '458', 'California', 'F8', 'Roma', 'SF90', 'Other'],
  Fiat: ['500', 'Panda', 'Tipo', 'Doblo', 'Other'],
  Ford: ['Bronco', 'C-Max', 'EcoSport', 'Escape', 'Explorer', 'F-150', 'Fiesta', 'Focus', 'Fusion', 'Kuga', 'Mustang', 'Ranger', 'Transit', 'Other'],
  Genesis: ['G80', 'G90', 'GV60', 'GV70', 'GV80', 'Other'],
  GMC: ['Acadia', 'Canyon', 'Sierra', 'Terrain', 'Yukon', 'Other'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Insight', 'Jazz', 'Odyssey', 'Pilot', 'Ridgeline', 'S2000', 'Other'],
  Hyundai: ['Accent', 'Elantra', 'Ioniq', 'Kona', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster', 'Other'],
  Infiniti: ['Q30', 'Q50', 'Q60', 'Q70', 'QX50', 'QX60', 'QX80', 'Other'],
  Jaguar: ['E-Pace', 'F-Type', 'I-Pace', 'XE', 'XF', 'XJ', 'Other'],
  Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler', 'Other'],
  Kia: ['Carens', 'Ceed', 'EV6', 'EV9', 'Niro', 'Optima', 'Picanto', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Other'],
  Lamborghini: ['Aventador', 'Huracán', 'Urus', 'Other'],
  'Land Rover': ['Defender', 'Discovery', 'Evoque', 'Freelander', 'Range Rover', 'Other'],
  Lexus: ['CT', 'ES', 'GS', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'UX', 'Other'],
  Lincoln: ['Aviator', 'Corsair', 'Nautilus', 'Navigator', 'Other'],
  Lotus: ['Elise', 'Evora', 'Exige', 'Other'],
  Maserati: ['Ghibli', 'GranTurismo', 'Levante', 'MC20', 'Quattroporte', 'Other'],
  Mazda: ['2', '3', '5', '6', 'CX-3', 'CX-5', 'CX-60', 'MX-5', 'RX-7', 'Other'],
  McLaren: ['540C', '570S', '600LT', '720S', 'Artura', 'GT', 'Other'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class', 'SL', 'SLC', 'V-Class', 'AMG', 'Other'],
  Mini: ['Clubman', 'Countryman', 'Cooper', 'One', 'Other'],
  Mitsubishi: ['ASX', 'Eclipse Cross', 'Lancer', 'Outlander', 'Pajero', 'Space Star', 'Other'],
  Nissan: ['350Z', '370Z', 'Altima', 'GT-R', 'Juke', 'Leaf', 'Micra', 'Murano', 'Note', 'Qashqai', 'X-Trail', 'Other'],
  Opel: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Vectra', 'Zafira', 'Other'],
  Peugeot: ['208', '308', '508', '2008', '3008', '5008', 'Partner', 'Other'],
  Porsche: ['911', '718', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panth', 'Taycan', 'Other'],
  Ram: ['1500', '2500', '3500', 'Dakota', 'Other'],
  Renault: ['Clio', 'Captur', 'Kangoo', 'Megane', 'Scenic', 'Twingo', 'Zoe', 'Other'],
  'Rolls-Royce': ['Cullinan', 'Ghost', 'Phantom', 'Wraith', 'Other'],
  Saab: ['9-3', '9-5', 'Other'],
  Seat: ['Ibiza', 'Leon', 'Ateca', 'Arona', 'Tarraco', 'Other'],
  Skoda: ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Rapid', 'Other'],
  Smart: ['ForTwo', 'ForFour', 'Other'],
  Subaru: ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'XV', 'Other'],
  Suzuki: ['Baleno', 'Celerio', 'Swift', 'Vitara', 'SX4', 'Other'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster', 'Other'],
  Toyota: ['Auris', 'Avensis', 'Aygo', 'Camry', 'Corolla', 'C-HR', 'Highlander', 'Land Cruiser', 'Prius', 'RAV4', 'Yaris', 'Other'],
  Volkswagen: ['Beetle', 'Caddy', 'Golf', 'Jetta', 'Passat', 'Polo', 'T-Cross', 'T-Roc', 'Touareg', 'up!', 'Other'],
  Volvo: ['C40', 'S60', 'S80', 'V40', 'V60', 'V70', 'XC40', 'XC60', 'XC90', 'Other'],
  Alpine: ['A110', 'Other'],
  BYD: ['Atto 3', 'Seal', 'Han', 'Tang', 'Other'],
  MG: ['3', '4', '5', 'ZS', 'Other'],
  Polestar: ['2', '3', '4', 'Other'],
  Rivian: ['R1T', 'R1S', 'Other'],
  Vauxhall: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Vivaro', 'Other'],
  Other: ['Other'],
}

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

function getAssetPath(path: string) {
  const normalizedBase = import.meta.env.BASE_URL.replace(/\/$/, '')
  return path.startsWith('/')
    ? `${normalizedBase}${path}`
    : `${normalizedBase}/${path}`
}

function GlowworksPage() {
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
  const [appointmentMessage, setAppointmentMessage] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false)
  const [homepageImages, setHomepageImages] = useState<
    Partial<Record<HomepageImageSlot, HomepageImageRecord>>
  >({})

  const getHomepageImage = (
    slot: HomepageImageSlot,
    fallbackImage: string,
  ) => homepageImages[slot]?.publicUrl ?? getAssetPath(fallbackImage)

  useEffect(() => {
    let isActive = true

    fetchHomepageImages()
      .then((images) => {
        if (!isActive) {
          return
        }

        setHomepageImages(
          Object.fromEntries(
            images.map((image) => [image.slot, image]),
          ) as Partial<Record<HomepageImageSlot, HomepageImageRecord>>,
        )
      })
      .catch((error) => {
        console.warn('Failed to load homepage images', error)
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const projectTitle = search.get('project')
    const requestedService = search.get('service')
    const requestedBrand = search.get('brand')
    const requestedModel = search.get('model')

    if (requestedService) {
      setSelectedService(requestedService)
      setServiceSearch(requestedService)
    }

    if (requestedBrand) {
      setSelectedVehicleBrand(requestedBrand)
      setVehicleSearch(requestedBrand)
    }

    if (requestedModel) {
      setSelectedVehicleModel(requestedModel)
      setVehicleModelSearch(requestedModel)
    }

    if (projectTitle) {
      setAppointmentMessage(
        `Ενδιαφέρομαι για ένα project όπως: ${projectTitle}`,
      )
    }
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('.mobile-service-reveal'),
    )

    if (!rows.length) {
      return
    }

    if (!('IntersectionObserver' in window)) {
      rows.forEach((row) => row.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    rows.forEach((row) => observer.observe(row))

    return () => observer.disconnect()
  }, [])


  useEffect(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('.project-scroll-reveal'),
    )

    if (!cards.length) {
      return
    }

    if (!('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -7% 0px',
      },
    )

    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setFormStatus('sending')

  const form = event.currentTarget
  const formData = new FormData(form)
  const body = new URLSearchParams()

  formData.forEach((value, key) => {
    body.append(key, String(value))
  })

  try {
    const response = await fetch('/_forms.html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error('Appointment submission failed')
    }

    form.reset()
    setSelectedVehicleBrand('')
    setSelectedVehicleModel('')
    setSelectedVehicleYear('')
    setSelectedService('')
    setVehicleSearch('')
    setVehicleModelSearch('')
    setVehicleYearSearch('')
    setServiceSearch('')
    setAppointmentMessage('')
    setFormStatus('success')
  } catch (error) {
    console.error('Failed to submit appointment', error)
    setFormStatus('error')
  }
}

  const closeMenu = () => setMenuOpen(false)
  const heroBackgroundImage = getHomepageImage('hero', '/images/homepage-ambient-mercedes.png')
  const filteredVehicleBrands = vehicleBrands.filter((brand) => {
    const query = vehicleSearch.trim().toLowerCase()
    if (!query) {
      return true
    }
    return brand.toLowerCase().includes(query)
  })

  const filteredVehicleModels = (selectedVehicleBrand ? vehicleModels[selectedVehicleBrand] || [] : []).filter((model) => {
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

  return (
<main id="top">
      <nav
        className={[
          'site-nav',
          scrolled ? 'is-scrolled' : '',
          menuOpen ? 'menu-open' : '',
        ].filter(Boolean).join(' ')}
      >
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Glowworks.lab αρχική" onClick={closeMenu}>
            <img src={getAssetPath('/images/glowworks-logo.webp')} alt="Glowworks.lab" />
            <span className="brand-name">GLOWWORKS.LAB</span>
          </a>

          <div className={menuOpen ? 'nav-links is-open' : 'nav-links'}>

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
            <p className="eyebrow"><span /> AUTOMOTIVE LIGHTING & CUSTOMIZATION</p>
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
            <p>Σχεδιασμένο γύρω από το δικό σου ταξίδι.</p>
            <div className="hero-card-meta">
              <span>GLOWWORKS SIGNATURE</span>
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
          Κάθε εγκατάσταση σχεδιάζεται για το συγκεκριμένο όχημα, με καθαρό φινίρισμα και εργοστασιακό αποτέλεσμα.
        </p>
      </section>

      <section className="work-grid shell" aria-label="Projects Glowworks.lab">
        {services.map((service, index) => (
          <a
            className={`work-card work-card-${index + 1} project-scroll-reveal`}
            key={service.title}
            href={getAssetPath(
              `/projects?service=${encodeURIComponent(service.projectServiceId)}`,
            )}
            aria-label={`View ${service.title} projects`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <img src={getHomepageImage(service.imageSlot as HomepageImageSlot, service.image)} alt={service.title} />
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
            {services.map((service) => {
              const Icon = service.icon
              return (
                <a
                  className="service-row mobile-service-reveal"
                  key={service.title}
                  href={getAssetPath(`/projects?service=${service.projectServiceId}`)}
                  style={{ color: 'inherit', textDecoration: 'none' }}
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
              <a href="https://maps.app.goo.gl/va2psSDWoRwo5FZG9" target="_blank" rel="noreferrer"><MapPin size={19} /> <span><small>Τοποθεσία</small>Glowworks.lab, Ρόδος</span></a>
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
                    </div>
                  </label>
                  <label><CalendarDays size={16} /> Προτιμώμενη ημερομηνία<input name="date" type="date" /></label>
                  <label><Clock3 size={16} /> Ώρα
                    <select name="time" defaultValue="Οποιαδήποτε">
                      <option>Οποιαδήποτε</option><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option>
                    </select>
                  </label>
                  <label className="full">Σχόλια<textarea
                    name="message"
                    rows={4}
                    value={appointmentMessage}
                    onChange={(event) =>
                      setAppointmentMessage(event.target.value)
                    }
                    placeholder="Πες μας περισσότερα για την αναβάθμιση που έχεις στο μυαλό σου..."
                  /></label>
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
