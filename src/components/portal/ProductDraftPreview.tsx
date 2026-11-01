import { useEffect, useState } from 'react'
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import {
  fetchManagedProductImages,
  type ManagedProductImage,
} from '../../lib/product-images'

type PreviewProduct = {
  id: string
  slug: string
  title_el: string
  title_en: string | null
  description_el: string
  description_en: string | null
  price_eur: number | string | null
  availability: string
  vehicle_compatibility: string
  is_published: boolean
}

type Props = {
  product: PreviewProduct
  onClose: () => void
}

export function ProductDraftPreview({ product, onClose }: Props) {
  const [images, setImages] = useState<ManagedProductImage[]>([])
  const [selected, setSelected] = useState(0)
  const [language, setLanguage] = useState<'el' | 'en'>('el')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setImages([])
    setSelected(0)

    fetchManagedProductImages(product.id)
      .then((result) => {
        if (active) setImages(result)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [product.id])

  const en = language === 'en'
  const title = en ? product.title_en || product.title_el : product.title_el
  const description = en
    ? product.description_en || product.description_el
    : product.description_el

  const price = product.price_eur == null
    ? (en ? 'Ask for price' : 'Ρωτήστε τιμή')
    : new Intl.NumberFormat(en ? 'en-GB' : 'el-GR', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(product.price_eur))

  const availability = product.availability === 'available'
    ? (en ? 'Available' : 'Διαθέσιμο')
    : product.availability === 'made_to_order'
      ? (en ? 'Made to order' : 'Κατόπιν παραγγελίας')
      : (en ? 'Out of stock' : 'Εξαντλημένο')

  const photo = images[selected] ?? images[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product preview"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90 p-3 sm:p-7"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#191923] p-3 text-white">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-[#4cd3d1]/15 px-3 py-2 text-xs font-bold text-[#4cd3d1]">
              {product.is_published ? 'PUBLISHED PREVIEW' : 'DRAFT PREVIEW'}
            </span>
            <span className="text-xs text-white/50">Admin only</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white"
            >
              {language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setDevice(device === 'desktop' ? 'mobile' : 'desktop')}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white"
            >
              {device === 'desktop' ? 'Mobile view' : 'Desktop view'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg border border-white/20 p-2 text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className="mx-auto overflow-hidden rounded-xl border border-white/10 bg-[#09090d] text-white"
          style={{ maxWidth: device === 'mobile' ? 390 : 1200 }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" className="w-28" />
            <span className="text-xs text-white/50">PRODUCT PREVIEW</span>
          </div>

          <div className="px-5 py-7 sm:px-8">
            <div className="mb-7 flex items-center gap-2 text-sm text-[#4cd3d1]">
              <ArrowLeft size={16} />
              {en ? 'Products' : 'Προϊόντα'}
              <span className="text-white/30">/</span>
              <span className="truncate text-white/65">{title}</span>
            </div>

            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: device === 'desktop'
                  ? 'minmax(0, 1fr) minmax(0, 1fr)'
                  : 'minmax(0, 1fr)',
              }}
            >
              <div className="min-w-0">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#191923]">
                  {photo?.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt={photo.alt_text || title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={60} className="text-white/20" />
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelected(index)}
                        className="h-16 w-16 overflow-hidden rounded-lg border"
                        style={{
                          borderColor: selected === index ? '#4cd3d1' : '#33333b',
                        }}
                      >
                        <img
                          src={image.signedUrl}
                          alt={image.alt_text || title}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {loading && <p className="mt-3 text-sm text-white/50">Loading images...</p>}
                {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              </div>

              <div className="min-w-0">
                <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#4cd3d1]">
                  GLOWWORKS.LAB / 3D PRINTING
                </p>

                <h1
                  className="break-words font-bold uppercase leading-tight text-white"
                  style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: device === 'mobile' ? 34 : 46,
                  }}
                >
                  {title}
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <strong className="text-3xl">{price}</strong>
                  <span className="rounded-full border border-white/20 px-3 py-2 text-xs text-white/70">
                    {availability}
                  </span>
                </div>

                {description && (
                  <section className="mt-8">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/75">
                      {en ? 'Description' : 'Περιγραφή'}
                    </h2>
                    <p className="whitespace-pre-line leading-7 text-white/65">{description}</p>
                  </section>
                )}

                {product.vehicle_compatibility && (
                  <section className="mt-7 border-t border-white/10 pt-6">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/75">
                      {en ? 'Vehicle compatibility' : 'Συμβατότητα οχημάτων'}
                    </h2>
                    <p className="whitespace-pre-line text-white/65">
                      {product.vehicle_compatibility}
                    </p>
                  </section>
                )}

                <div
                  className="mt-8 rounded-lg bg-[#dc376f] px-5 py-4 text-center font-semibold text-white"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {en ? 'ENQUIRE ON WHATSAPP' : 'ΡΩΤΗΣΕ ΣΤΟ WHATSAPP'}
                </div>
                <p className="mt-3 text-xs text-white/40">
                  {en ? 'Preview only — no message will be sent.' : 'Μόνο προεπισκόπηση — δεν αποστέλλεται μήνυμα.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}