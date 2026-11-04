import { SiteFooter } from '../../components/SiteFooter'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUpRight, Image as ImageIcon, MessageCircle, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { useLanguage } from '../../lib/language'
import { fetchPublishedProductBySlug } from '../../lib/products'
import type { ProductRecord } from '../../types/products'

export const Route = createFileRoute('/products/$productSlug')({
  component: ProductDetailPage,
})

const WHATSAPP_NUMBER = '306937153914'

function ProductDetailPage() {
  const { productSlug } = Route.useParams()
  const { language } = useLanguage()
  const en = language === 'en'

  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    setProduct(null)
    setSelectedImage(0)

    fetchPublishedProductBySlug(productSlug)
      .then((result) => {
        if (active) setProduct(result)
      })
      .catch((err) => {
        console.error('Could not load product', err)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productSlug])

  const title = product
    ? (en ? product.titleEn || product.titleEl : product.titleEl)
    : ''

  const description = product
    ? (en
        ? product.descriptionEn || product.descriptionEl
        : product.descriptionEl)
    : ''

  const price = product?.priceEur == null
    ? (en ? 'Ask for price' : 'Ρωτήστε τιμή')
    : new Intl.NumberFormat(en ? 'en-GB' : 'el-GR', {
        style: 'currency',
        currency: 'EUR',
      }).format(product.priceEur)

  const availability = product?.availability === 'available'
    ? (en ? 'Available' : 'Διαθέσιμο')
    : product?.availability === 'made_to_order'
      ? (en ? 'Made to order' : 'Κατόπιν παραγγελίας')
      : (en ? 'Out of stock' : 'Εξαντλημένο')

  const message = en
    ? `Hello Glowworks.lab! I am interested in the product "${title}" (${product?.slug ?? ''}). Could you provide more information?`
    : `Καλησπέρα Glowworks.lab! Ενδιαφέρομαι για το προϊόν "${title}" (${product?.slug ?? ''}). Θα ήθελα περισσότερες πληροφορίες.`

  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  const images = product?.images ?? []
  const currentImage = images[selectedImage] ?? images[0]

  return (
    <div id="top" className="product-detail-page min-h-screen bg-[#09090d] text-white">
      <nav className="site-nav project-nav is-scrolled" aria-label={en ? 'Main navigation' : 'Κύρια πλοήγηση'}>
        <div className="nav-shell">
          <Link to="/" className="brand" aria-label="Glowworks.lab">
            <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" />
          </Link>
          <div className="project-nav-links">
            <LanguageSwitcher />
            <Link to="/products">
              <ArrowLeft size={16} />
              {en ? 'Products' : 'Προϊόντα'}
            </Link>
            <a className="nav-book" href="/#booking">
              {en ? 'Book an appointment' : 'Κλείσε ραντεβού'}
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-[100px] sm:px-8 sm:pt-[112px]">

        {loading ? (
          <div className="py-28 text-center text-white/55">
            {en ? 'Loading product...' : 'Φόρτωση προϊόντος...'}
          </div>
        ) : error ? (
          <div className="py-28 text-center text-white/55">
            {en
              ? 'Unable to load this product. Please try again later.'
              : 'Δεν ήταν δυνατή η φόρτωση του προϊόντος. Δοκίμασε ξανά αργότερα.'}
          </div>
        ) : !product ? (
          <section className="py-28 text-center">
            <Package className="mx-auto mb-5 text-white/30" size={48} />
            <h1 className="text-3xl font-semibold">
              {en ? 'Product not found' : 'Το προϊόν δεν βρέθηκε'}
            </h1>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 text-[var(--cyan)]">
              <ArrowLeft size={17} />
              {en ? 'Back to products' : 'Επιστροφή στα προϊόντα'}
            </Link>
          </section>
        ) : (
          <>
            <nav className="py-8 text-sm text-white/45">
              <Link to="/products" className="hover:text-white">
                {en ? 'Products' : 'Προϊόντα'}
              </Link>
              <span className="mx-3">/</span>
              <span className="text-white/75">{title}</span>
            </nav>

            <main className="product-detail-layout grid gap-12 lg:grid-cols-2 lg:gap-16">
              <section>
                <div className="product-detail-main-image aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#141419]">
                  {currentImage?.signedUrl ? (
                    <img
                      src={currentImage.signedUrl}
                      alt={currentImage.altText || title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20">
                      <ImageIcon size={64} strokeWidth={1} />
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {images.map((image, index) => (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        aria-label={`${en ? 'View image' : 'Προβολή εικόνας'} ${index + 1}`}
                        className={`aspect-square overflow-hidden rounded-xl border ${
                          selectedImage === index
                            ? 'border-[var(--cyan)]'
                            : 'border-white/10'
                        }`}
                      >
                        <img
                          src={image.signedUrl}
                          alt={image.altText || `${title} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="py-2">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--cyan)]">
                  {product.category
                    ? (en
                        ? product.category.nameEn || product.category.nameEl
                        : product.category.nameEl)
                    : '3D PRINTING'}
                </p>

                <h1 className="product-detail-title text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {title}
                </h1>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <span className="text-3xl font-semibold">{price}</span>
                  <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70">
                    {availability}
                  </span>
                </div>

                {description && (
                  <div className="mt-9">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/65">
                      {en ? 'Description' : 'Περιγραφή'}
                    </h2>
                    <p className="whitespace-pre-line leading-8 text-white/65">
                      {description}
                    </p>
                  </div>
                )}

                {product.vehicleCompatibility && (
                  <div className="mt-9 border-t border-white/10 pt-7">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/65">
                      {en ? 'Vehicle compatibility' : 'Συμβατότητα οχημάτων'}
                    </h2>
                    <p className="whitespace-pre-line leading-7 text-white/65">
                      {product.vehicleCompatibility}
                    </p>
                  </div>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-detail-whatsapp mt-10 inline-flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 font-semibold text-white transition sm:w-auto"
                >
                  <MessageCircle size={20} />
                  {en ? 'Enquire on WhatsApp' : 'Ρώτησε στο WhatsApp'}
                  <ArrowRight size={18} />
                </a>

                <p className="mt-4 text-xs text-white/40">
                  {en
                    ? 'Enquiries only. No online payment is required.'
                    : 'Επικοινωνία για πληροφορίες ή παραγγελία, χωρίς online πληρωμή.'}
                </p>
              </section>
            </main>
          </>
        )}

      </div>
      <SiteFooter />
    </div>
  )
}