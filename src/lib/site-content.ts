export type PublicService = {
  id: string
  number: string
  title: string
  description: string
  image: string
}

export type PublicProject = {
  id: string
  serviceId: string
  brand: string
  model: string
  title: string
  image: string
}

export type WebsiteContent = {
  contentVersion: string
  heroImage: string
  services: PublicService[]
  projects: PublicProject[]
  vehicleBrandModels: Record<string, string[]>
}

export const WEBSITE_CONTENT_VERSION = '2026-08-07'

export const DEFAULT_SERVICES: PublicService[] = [
  {
    id: 'ambient-lighting',
    number: '01',
    title: 'Ambient Light',
    description:
      'OEM-style φωτισμός σε πόρτες, ταμπλό και κονσόλα με χρώματα και δυναμικά προγράμματα.',
    image: '/images/ambient-light.webp',
  },
  {
    id: 'carbon-steering-wheels',
    number: '02',
    title: 'Custom Τιμόνι',
    description:
      'Δέρμα, Alcantara ή carbon look, custom ραφές και σχεδιασμός που ταιριάζει απόλυτα στο αυτοκίνητό σου.',
    image: '/images/custom-steering.webp',
  },
  {
    id: 'starlight-headliner',
    number: '03',
    title: 'Αστέρια Οροφής',
    description:
      'Πάνω από 600 οπτικές ίνες, shooting stars και ατμόσφαιρα που αλλάζει όλο το εσωτερικό.',
    image: '/images/starlight-headliner.webp',
  },
  {
    id: 'screens-media',
    number: '04',
    title: 'Οθόνες & Media',
    description:
      'Οθόνες υψηλής ανάλυσης, σύγχρονο infotainment και καθαρή εργοστασιακή εφαρμογή στο ταμπλό.',
    image: '/images/android-display.webp',
  },
  {
    id: 'body-kit',
    number: '05',
    title: 'body kits & exterior upgrades',
    description:
      'Premium body kits κορυφαίας σχεδίασης και αεροδυναμικής. Χαρίστε στο αυτοκίνητό σας την απόλυτη πολυτελή σπορ εμφάνιση.',
    image: '/images/body-kit-exterior.jpg',
  },
]

export const DEFAULT_PROJECTS: PublicProject[] = [
  { id: 'prj-001', serviceId: 'ambient-lighting', brand: 'Mercedes-Benz', model: 'A-Class W177', title: 'Ambient Lighting • Mercedes A-Class W177', image: '/images/mercedes_a_class_w1172.jpg' },
  { id: 'prj-002', serviceId: 'ambient-lighting', brand: 'Mercedes-Benz', model: 'C-Class W205', title: 'Ambient Lighting • Mercedes C-Class W205', image: '/images/mercedes_c_class_w205_coupe.jpg' },
  { id: 'prj-003', serviceId: 'ambient-lighting', brand: 'Mercedes-Benz', model: 'GLA X156', title: 'Ambient Lighting • Mercedes GLA X156', image: '/images/mercedes_glc_w205_coupe.jpg' },
  { id: 'prj-004', serviceId: 'ambient-lighting', brand: 'BMW', model: 'M4 G82', title: 'Ambient Lighting • BMW M4 G82', image: '/images/bmw-m-performance.jpg' },
  { id: 'prj-005', serviceId: 'ambient-lighting', brand: 'Audi', model: 'A3', title: 'Ambient Lighting • Audi A3', image: '/images/audi-premium-interior.jpg' },
  { id: 'prj-006', serviceId: 'carbon-steering-wheels', brand: 'BMW', model: 'M3 G80', title: 'Carbon Steering Wheel • BMW M3 G80', image: '/images/bmw-m-performance.jpg' },
  { id: 'prj-007', serviceId: 'carbon-steering-wheels', brand: 'Audi', model: 'A3', title: 'Carbon Steering Wheel • Audi A3', image: '/images/custom-steering.webp' },
  { id: 'prj-008', serviceId: 'starlight-headliner', brand: 'Rolls-Royce', model: 'Ghost', title: 'Starlight Headliner • Rolls-Royce Ghost', image: '/images/starlight-headliner.webp' },
  { id: 'prj-009', serviceId: 'starlight-headliner', brand: 'Rolls-Royce', model: 'Phantom', title: 'Starlight Headliner • Rolls-Royce Phantom', image: '/images/starlight-headliner.webp' },
  { id: 'prj-010', serviceId: 'screens-media', brand: 'Mercedes-Benz', model: 'E-Class W213', title: 'Screens & Media • Mercedes-Benz E-Class W213', image: '/images/android-display.webp' },
  { id: 'prj-011', serviceId: 'screens-media', brand: 'Audi', model: 'A3', title: 'Screens & Media • Audi A3', image: '/images/audi-premium-interior.jpg' },
  { id: 'prj-012', serviceId: 'body-kit', brand: 'BMW', model: '118i F40', title: 'Body Kit • BMW 118i F40', image: '/images/body-kit-exterior.jpg' },
  { id: 'prj-013', serviceId: 'body-kit', brand: 'Volkswagen', model: 'Golf MK8', title: 'Body Kit • Volkswagen Golf MK8', image: '/images/body-kit-exterior.jpg' },
]

export const DEFAULT_VEHICLE_BRAND_MODELS: Record<string, string[]> = {
  Audi: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'R8', 'RS', 'TT', 'Other'],
  BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'M Series', 'X1', 'X3', 'X5', 'X7', 'Other'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class', 'V-Class', 'AMG', 'Other'],
  Volkswagen: ['Golf', 'Passat', 'Polo', 'T-Roc', 'Touareg', 'Other'],
  'Rolls-Royce': ['Cullinan', 'Ghost', 'Phantom', 'Wraith', 'Other'],
  Porsche: ['911', '718', 'Cayenne', 'Macan', 'Taycan', 'Other'],
  Toyota: ['Corolla', 'C-HR', 'RAV4', 'Yaris', 'Other'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Other'],
  Nissan: ['Qashqai', 'Juke', 'GT-R', 'Other'],
  Hyundai: ['i20', 'i30', 'Tucson', 'Santa Fe', 'Other'],
  Kia: ['Ceed', 'Sportage', 'Sorento', 'EV6', 'Other'],
  Ford: ['Fiesta', 'Focus', 'Mustang', 'Kuga', 'Other'],
  Other: ['Other'],
}

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  contentVersion: WEBSITE_CONTENT_VERSION,
  heroImage: '/images/ambient-light.webp',
  services: DEFAULT_SERVICES,
  projects: DEFAULT_PROJECTS,
  vehicleBrandModels: DEFAULT_VEHICLE_BRAND_MODELS,
}

export const SERVICE_SEARCH_ALIASES: Record<string, string> = {
  'ambient light': 'ambient-lighting',
  'ambient lighting': 'ambient-lighting',
  'αμπιεντ λιγητ': 'ambient-lighting',
  'custom τιμόνι': 'carbon-steering-wheels',
  'custom τιμονι': 'carbon-steering-wheels',
  'carbon steering wheel': 'carbon-steering-wheels',
  'αστέρια οροφής': 'starlight-headliner',
  'αστερια οροφης': 'starlight-headliner',
  'starlight headliner': 'starlight-headliner',
  'οθόνες & media': 'screens-media',
  'οθονες & media': 'screens-media',
  'body kits & exterior upgrades': 'body-kit',
  'body kit': 'body-kit',
}

export function deepCloneWebsiteContent(content: WebsiteContent): WebsiteContent {
  return {
    contentVersion: content.contentVersion ?? WEBSITE_CONTENT_VERSION,
    heroImage: content.heroImage,
    services: content.services.map((service) => ({ ...service })),
    projects: content.projects.map((project) => ({ ...project })),
    vehicleBrandModels: Object.fromEntries(
      Object.entries(content.vehicleBrandModels).map(([brand, models]) => [brand, [...models]]),
    ),
  }
}
