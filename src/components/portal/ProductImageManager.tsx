import { useEffect, useState, type ChangeEvent } from 'react'
import {
  deleteProductImage,
  fetchManagedProductImages,
  setProductImageCover,
  uploadProductImages,
  type ManagedProductImage,
} from '../../lib/product-images'

type Props = {
  productId: string
  readOnly?: boolean
}

export function ProductImageManager({
  productId,
  readOnly = false,
}: Props) {
  const [images, setImages] = useState<ManagedProductImage[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setImages([])
    setFiles([])
    setError('')
    setStatus('')

    fetchManagedProductImages(productId)
      .then((result) => {
        if (active) setImages(result)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [productId])

  async function reload() {
    const result = await fetchManagedProductImages(productId)
    setImages(result)
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    const selected = Array.from(event.target.files ?? [])
    setFiles(selected)
  }

  async function upload() {
    if (busy || readOnly || files.length === 0) return

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await uploadProductImages(productId, files)
      setFiles([])
      await reload()
      setStatus('Photos uploaded successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function makeCover(image: ManagedProductImage) {
    if (busy || readOnly || image.is_cover) return

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await setProductImageCover(productId, image.id)
      await reload()
      setStatus('Cover photo updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      try { await reload() } catch { /* Preserve the original error. */ }
    } finally {
      setBusy(false)
    }
  }

  async function removeImage(image: ManagedProductImage) {
    if (busy || readOnly) return

    if (!window.confirm('Delete this product photo permanently?')) {
      return
    }

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await deleteProductImage(image)
      await reload()
      setStatus('Photo deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      try { await reload() } catch { /* Preserve the original error. */ }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="portal-card"
      style={{ marginTop: 18, padding: 20 }}
    >
      <div className="portal-card-title-row">
        <div>
          <h4>Product Photos</h4>
          <p className="portal-muted">
            Upload photos, choose a cover image and manage your gallery.
          </p>
        </div>
        <span className="portal-chip">
          {images.length} photos
        </span>
      </div>

      {error && (
        <p role="alert" style={{ color: '#fb7185', marginTop: 12 }}>
          {error}
        </p>
      )}

      {status && (
        <p role="status" style={{ color: '#86efac', marginTop: 12 }}>
          {status}
        </p>
      )}

      {!readOnly && (
        <div style={{ marginTop: 20 }}>
          <label>
            <span>Choose images (JPEG / PNG / WebP, max 15 MB each)</span>
            <input
              key={productId + '-' + (files.length === 0 ? 'empty' : 'selected')}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={chooseFiles}
            />
          </label>

          {files.length > 0 && (
            <div className="portal-actions" style={{ marginTop: 12 }}>
              <span className="portal-muted">
                {files.length} selected
              </span>
              <button
                type="button"
                className="button button-primary"
                disabled={busy}
                onClick={() => void upload()}
              >
                {busy ? 'Uploading...' : 'Upload selected photos'}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="portal-muted" style={{ marginTop: 20 }}>
          Loading product photos...
        </p>
      ) : images.length === 0 ? (
        <p className="portal-muted" style={{ marginTop: 20 }}>
          No photos uploaded yet.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
            gap: 18,
            marginTop: 24,
          }}
        >
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                border: image.is_cover
                  ? '2px solid var(--cyan, #67e4dc)'
                  : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14,
                padding: 12,
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#17171c',
                }}
              >
                {image.signedUrl ? (
                  <img
                    src={image.signedUrl}
                    alt={image.alt_text || 'Product photo'}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className="portal-muted">
                    Preview unavailable
                  </div>
                )}
              </div>

              <p style={{ marginTop: 10, fontSize: 12 }}>
                {image.is_cover ? '★ Cover photo' : 'Gallery photo'}
              </p>

              {!readOnly && (
                <div
                  className="portal-actions"
                  style={{ marginTop: 10, gap: 8 }}
                >
                  {!image.is_cover && (
                    <button
                      className="button button-secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => void makeCover(image)}
                    >
                      Set cover
                    </button>
                  )}

                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => void removeImage(image)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}