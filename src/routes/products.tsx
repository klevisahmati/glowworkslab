import { SiteFooter } from '../components/SiteFooter'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUpRight, Image as ImageIcon, MessageCircle, Package, Search, SlidersHorizontal, X, Phone, Instagram } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../lib/language'
import { fetchProductCategories, fetchPublishedProducts } from '../lib/products'
import type { ProductCategory, ProductRecord } from '../types/products'

export const Route = createFileRoute('/products')({
  component: ProductsPage,
  head: ({ match }) => ({
    meta: [
      {
        title: match.context.initialLanguage === 'en'
          ? '3D Printed Products — Glowworks.lab'
          : '3D Εκτυπωμένα Προϊόντα — Glowworks.lab',
      },
      {
        name: 'description',
        content: match.context.initialLanguage === 'en'
          ? 'Explore custom 3D printed automotive parts and accessories by Glowworks.lab in Rhodes.'
          : 'Ανακάλυψε 3D εκτυπωμένα ανταλλακτικά και αξεσουάρ αυτοκινήτων από τη Glowworks.lab στη Ρόδο.',
      },
    ],
  }),
})

function ProductsPage() {
  const { language } = useLanguage()
  const en = language === 'en'

  const [products, setProducts] = useState<ProductRecord[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeProduct, setActiveProduct] = useState<ProductRecord | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    let active = true

    Promise.all([
      fetchPublishedProducts(),
      fetchProductCategories(),
    ])
      .then(([loadedProducts, loadedCategories]) => {
        if (!active) return
        setProducts(loadedProducts)
        setCategories(loadedCategories)
        setError(false)
      })
      .catch((err) => {
        console.error('Failed to load products', err)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const visibleProducts = useMemo(() => {
    const term = search.toLocaleLowerCase().trim()

    return products.filter((product) => {
      const matchesCategory =
        category === 'all' || product.categoryId === category

      const text = [
        product.titleEl,
        product.titleEn,
        product.descriptionEl,
        product.descriptionEn,
        product.vehicleCompatibility,
      ].filter(Boolean).join(' ').toLocaleLowerCase()

      return matchesCategory && (!term || text.includes(term))
    })
  }, [products, category, search])

  useEffect(() => {
    if (!activeProduct) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveProduct(null)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeProduct])

  const openProduct = (product: ProductRecord) => {
    setActiveImageIndex(0)
    setActiveProduct(product)
  }

  const activeTitle = activeProduct
    ? (en ? activeProduct.titleEn || activeProduct.titleEl : activeProduct.titleEl)
    : ''
  const activeDescription = activeProduct
    ? (en ? activeProduct.descriptionEn || activeProduct.descriptionEl : activeProduct.descriptionEl)
    : ''
  const activePrice = activeProduct?.priceEur == null
    ? (en ? 'Ask for price' : 'Ρωτήστε τιμή')
    : new Intl.NumberFormat(en ? 'en-GB' : 'el-GR', {
        style: 'currency', currency: 'EUR',
      }).format(activeProduct.priceEur)
  const activeImages = activeProduct?.images ?? []
  const activeImage = activeImages[activeImageIndex] ?? activeImages[0]
  const message = en
    ? `Hello Glowworks.lab! I am interested in the product "${activeTitle}" (${activeProduct?.slug ?? ''}). Could you provide more information?`
    : `Καλησπέρα Glowworks.lab! Ενδιαφέρομαι για το προϊόν "${activeTitle}" (${activeProduct?.slug ?? ''}). Θα ήθελα περισσότερες πληροφορίες.`
  const whatsappUrl = `https://wa.me/306937153914?text=${encodeURIComponent(message)}`

  const availabilityLabel = (value: ProductRecord['availability']) => {
    if (value === 'available') return en ? 'Available' : 'Διαθέσιμο'
    if (value === 'made_to_order') {
      return en ? 'Made to order' : 'Κατόπιν παραγγελίας'
    }
    return en ? 'Out of stock' : 'Εξαντλημένο'
  }

  return (
    <div id="top" className="products-page min-h-screen bg-[#09090d] text-white">
      <nav className="site-nav project-nav is-scrolled" aria-label={en ? 'Main navigation' : 'Κύρια πλοήγηση'}>
        <div className="nav-shell">
          <Link to="/" className="brand" aria-label="Glowworks.lab">
            <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" />
          </Link>
          <div className="project-nav-links">
            <LanguageSwitcher />
            <Link to="/">
              <ArrowLeft size={16} />
              {en ? 'Home' : 'Αρχική'}
            </Link>
            <a className="nav-book" href="/#booking">
              {en ? 'Book an appointment' : 'Κλείσε ραντεβού'}
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-[100px] sm:px-8 sm:pt-[112px]">

        <section className="products-brand-hero relative overflow-hidden border-b border-white/10 py-20 sm:py-28">
          <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[var(--magenta)]/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--cyan)]">
              GLOWWORKS.LAB / 3D PRINTING
            </p>
            <h1 className="products-brand-title text-5xl font-semibold tracking-tight sm:text-7xl">
              {en ? 'Products' : 'Προϊόντα'}
              <span className="text-[var(--magenta)]">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              {en
                ? 'Precision-made 3D printed automotive parts and accessories. Designed for fit, function and individuality.'
                : '3D εκτυπωμένα εξαρτήματα και αξεσουάρ αυτοκινήτων, σχεδιασμένα με έμφαση στην εφαρμογή, τη λειτουργικότητα και τη λεπτομέρεια.'}
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={18} className="text-[var(--cyan)]" />
              <h2 className="text-lg font-semibold">
                {en ? 'Explore the collection' : 'Ανακάλυψε τη συλλογή'}
              </h2>
            </div>
            <span className="text-sm text-white/50">
              {visibleProducts.length} {en ? 'products' : 'προϊόντα'}
            </span>
          </div>

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="products-category-filters flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  category === 'all'
                    ? 'border-[var(--cyan)] bg-[var(--dark-cyan)] text-[var(--cyan)]'
                    : 'border-white/15 text-white/65 hover:border-white/40'
                }`}
              >
                {en ? 'All products' : 'Όλα τα προϊόντα'}
              </button>

              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    category === item.id
                      ? 'border-[var(--cyan)] bg-[var(--dark-cyan)] text-[var(--cyan)]'
                      : 'border-white/15 text-white/65 hover:border-white/40'
                  }`}
                >
                  {en ? item.nameEn || item.nameEl : item.nameEl}
                </button>
              ))}
            </div>

            <label className="flex w-full items-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 lg:w-72">
              <Search size={17} className="shrink-0 text-white/50" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={en ? 'Search products...' : 'Αναζήτηση προϊόντων...'}
                aria-label={en ? 'Search products' : 'Αναζήτηση προϊόντων'}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-16 text-center text-white/50">
              {en ? 'Loading products...' : 'Φόρτωση προϊόντων...'}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[var(--magenta)]/20 p-16 text-center text-white/70">
              {en
                ? 'Products could not be loaded. Please try again later.'
                : 'Δεν ήταν δυνατή η φόρτωση των προϊόντων. Δοκίμασε ξανά αργότερα.'}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Package size={30} className="text-[var(--cyan)]" />
              </div>
              <h3 className="text-2xl font-semibold">
                {products.length === 0
                  ? (en ? 'Our collection is coming soon' : 'Η συλλογή μας έρχεται σύντομα')
                  : (en ? 'No matching products' : 'Δεν βρέθηκαν προϊόντα')}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/55">
                {products.length === 0
                  ? (en
                      ? 'We are preparing our first custom-made 3D printed parts and accessories.'
                      : 'Ετοιμάζουμε τα πρώτα μας 3D εκτυπωμένα εξαρτήματα και αξεσουάρ.')
                  : (en
                      ? 'Try a different search or category.'
                      : 'Δοκίμασε διαφορετική αναζήτηση ή κατηγορία.')}
              </p>
            </div>
          ) : (
            <div className="products-catalog-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const title = en
                  ? product.titleEn || product.titleEl
                  : product.titleEl

                const image = product.images[0]?.signedUrl

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProduct(product)}
                    aria-label={`${en ? 'View details' : 'Προβολή λεπτομερειών'}: ${title}`}
                    className="products-catalog-card group w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--paper-deep)] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cyan)] hover:shadow-[0_18px_45px_rgba(76,211,209,0.08)]"
                  >
                    <div className="products-catalog-image aspect-[4/3] overflow-hidden bg-white/[0.04]">
                      {image ? (
                        <img
                          src={image}
                          alt={product.images[0]?.altText || title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                          <Package size={50} strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    <div className="products-catalog-info p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <span>{product.category
                          ? (en
                            ? product.category.nameEn || product.category.nameEl
                            : product.category.nameEl)
                          : '3D Printing'}
                        </span>
                        <span>·</span>
                        <span>{availabilityLabel(product.availability)}</span>
                      </div>

                      <h3 className="products-catalog-title text-lg font-semibold text-white">{title}</h3>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-lg font-semibold text-white">
                          {product.priceEur === null
                            ? (en ? 'Ask for price' : 'Ρωτήστε τιμή')
                            : new Intl.NumberFormat(
                                en ? 'en-GB' : 'el-GR',
                                { style: 'currency', currency: 'EUR' },
                              ).format(product.priceEur)}
                        </span>
                        <ArrowRight size={19} className="text-[var(--cyan)] transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

      </div>
      {activeProduct && (
        <div
          className="products-quickview-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveProduct(null)
          }}
        >
          <section
            className="products-quickview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-quickview-title"
          >
            <header className="products-quickview-header">
              <span>GLOWWORKS.LAB / 3D SHOP</span>
              <button
                type="button"
                className="products-quickview-close"
                onClick={() => setActiveProduct(null)}
                aria-label={en ? 'Close product details' : 'Κλείσιμο λεπτομερειών'}
              ><X size={21} /></button>
            </header>
            <div className="products-quickview-body">
              <div className="products-quickview-gallery">
                <div className="products-quickview-main-image">
                  {activeImage?.signedUrl ? (
                    <img src={activeImage.signedUrl} alt={activeImage.altText || activeTitle} />
                  ) : (
                    <ImageIcon size={48} className="text-white/25" />
                  )}
                </div>
                {activeImages.length > 1 && (
                  <div className="products-quickview-thumbs">
                    {activeImages.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        className={activeImageIndex === index ? 'selected' : ''}
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`${en ? 'Photo' : 'Φωτογραφία'} ${index + 1}`}
                      >
                        <img src={image.signedUrl} alt={image.altText || `${activeTitle} ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="products-quickview-details">
                <p className="products-quickview-category">
                  {activeProduct.category
                    ? (en ? activeProduct.category.nameEn || activeProduct.category.nameEl : activeProduct.category.nameEl)
                    : '3D PRINTING'}
                </p>
                <h2 id="products-quickview-title">{activeTitle}</h2>
                <div className="products-quickview-pricing">
                  <strong>{activePrice}</strong>
                  <span>{availabilityLabel(activeProduct.availability)}</span>
                </div>
                {activeDescription && (
                  <div className="products-quickview-section">
                    <h3>{en ? 'Description' : 'Περιγραφή'}</h3>
                    <p>{activeDescription}</p>
                  </div>
                )}
                {activeProduct.vehicleCompatibility && (
                  <div className="products-quickview-section">
                    <h3>{en ? 'Vehicle compatibility' : 'Συμβατότητα οχημάτων'}</h3>
                    <p>{activeProduct.vehicleCompatibility}</p>
                  </div>
                )}
                <a className="products-quickview-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={19} />
                  {en ? 'Enquire on WhatsApp' : 'Ερώτηση μέσω WhatsApp'}
                  <ArrowRight size={17} />
                </a>
                <div className="products-quickview-contact-options">
                  <a
                    href="tel:+306937153914"
                    className="products-quickview-contact-link"
                    aria-label={en ? 'Call Glowworks.lab' : 'Κλήση στη Glowworks.lab'}
                  >
                    <Phone size={18} />
                    <span>{en ? 'Call us' : 'Κλήση'}</span>
                  </a>
                  <a
                    href="https://www.instagram.com/glowworks.lab/"
                    className="products-quickview-contact-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Glowworks.lab Instagram"
                  >
                    <Instagram size={18} />
                    <span>Instagram</span>
                  </a>
                </div>                <p className="products-quickview-footnote">
                  {en ? 'Enquiries only. No online payment required.' : 'Επικοινωνία για πληροφορίες ή παραγγελία, χωρίς online πληρωμή.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
      <SiteFooter />
    </div>
  )
}