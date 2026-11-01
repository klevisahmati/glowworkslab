import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ProductImageManager } from './ProductImageManager'
import { ProductDraftPreview } from './ProductDraftPreview'
import { ProductManagerThumbnail } from './ProductManagerThumbnail'
import { uploadProductImages } from '../../lib/product-images'
import { requestProjectTranslation } from '../../lib/project-translation-request'
import {
  createManagedProduct,
  deleteManagedProduct,
  createProductCategory,
  createProductSlug,
  fetchManagedCategories,
  fetchManagedProducts,
  setProductPublished,
  updateManagedProduct,
  type ManagedProductDraft,
} from '../../lib/product-management'

type CategoryRow = {
  id: string
  slug: string
  name_el: string
  name_en: string | null
  is_active: boolean
}

type ProductRow = {
  id: string
  slug: string
  category_id: string | null
  title_el: string
  title_en: string | null
  description_el: string
  description_en: string | null
  price_eur: number | string | null
  availability: ManagedProductDraft['availability']
  vehicle_compatibility: string
  is_published: boolean
  is_featured: boolean
  sort_order: number
}

function emptyDraft(): ManagedProductDraft {
  return {
    slug: '',
    categoryId: null,
    titleEl: '',
    titleEn: '',
    descriptionEl: '',
    descriptionEn: '',
    priceEur: null,
    availability: 'made_to_order',
    vehicleCompatibility: '',
    isPublished: false,
    isFeatured: false,
    sortOrder: 0,
  }
}

function draftFromRow(row: ProductRow): ManagedProductDraft {
  return {
    slug: row.slug,
    categoryId: row.category_id,
    titleEl: row.title_el,
    titleEn: row.title_en ?? '',
    descriptionEl: row.description_el,
    descriptionEn: row.description_en ?? '',
    priceEur: row.price_eur === null ? null : Number(row.price_eur),
    availability: row.availability,
    vehicleCompatibility: row.vehicle_compatibility,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
  }
}

export function ProductManager({ readOnly = false }: { readOnly?: boolean }) {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [previewProduct, setPreviewProduct] = useState<ProductRow | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showProductEditor, setShowProductEditor] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [draft, setDraft] = useState<ManagedProductDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('')
  const [busy, setBusy] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translatingCategory, setTranslatingCategory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [productRows, categoryRows] = await Promise.all([
      fetchManagedProducts(),
      fetchManagedCategories(),
    ])

    setProducts(productRows as ProductRow[])
    setCategories(categoryRows as CategoryRow[])
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([fetchManagedProducts(), fetchManagedCategories()])
      .then(([productRows, categoryRows]) => {
        if (!active) return
        setProducts(productRows as ProductRow[])
        setCategories(categoryRows as CategoryRow[])
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  function change<K extends keyof ManagedProductDraft>(
    key: K,
    value: ManagedProductDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function translateProduct() {
    if (readOnly || busy || translating) return

    if (!draft.titleEl.trim()) {
      setError('Enter the Greek product title first.')
      return
    }

    setTranslating(true)
    setError('')
    setStatus('')

    try {
      const translation = await requestProjectTranslation(
        draft.titleEl,
        draft.descriptionEl,
      )

      setDraft((current) => ({
        ...current,
        titleEn: translation.title_en,
        descriptionEn: translation.description_en,
      }))

      setStatus('English translation ready. Review it before saving.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setTranslating(false)
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || busy) return

    setBusy(true)
    setError('')
    setStatus('')

    try {
      let preparedDraft = { ...draft }

      const missingEnglishTitle = !preparedDraft.titleEn?.trim()
      const missingEnglishDescription =
        Boolean(preparedDraft.descriptionEl.trim()) &&
        !preparedDraft.descriptionEn?.trim()

      if (missingEnglishTitle || missingEnglishDescription) {
        const translation = await requestProjectTranslation(
          preparedDraft.titleEl,
          preparedDraft.descriptionEl,
        )

        preparedDraft = {
          ...preparedDraft,
          titleEn: missingEnglishTitle
            ? translation.title_en
            : preparedDraft.titleEn,
          descriptionEn: missingEnglishDescription
            ? translation.description_en
            : preparedDraft.descriptionEn,
        }
      }

      if (!preparedDraft.slug.trim()) {
        preparedDraft.slug = createProductSlug(
          preparedDraft.titleEn || preparedDraft.titleEl,
        )
      }

      if (!preparedDraft.slug) {
        throw new Error('Could not create a URL for this product.')
      }

      if (editingId) {
        await updateManagedProduct(editingId, { ...preparedDraft, isPublished: products.find((item) => item.id === editingId)?.is_published ?? false })
        setStatus('Product updated successfully.')
      } else {
        const newId = await createManagedProduct({ ...preparedDraft, isPublished: false })
        setEditingId(newId)

        if (pendingPhotos.length > 0) {
          try {
            await uploadProductImages(newId, pendingPhotos)
            setPendingPhotos([])
            setStatus('Product and photos saved successfully.')
          } catch (photoError) {
            setError(
              'Product saved, but photo upload failed: ' +
              (photoError instanceof Error ? photoError.message : String(photoError)),
            )
            setStatus('Product created. You can retry the photos below.')
          }
        } else {
          setStatus('Product created successfully.')
        }
      }

      setDraft(preparedDraft)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function translateCategory() {
    if (readOnly || busy || translatingCategory) return

    if (!newCategoryName.trim()) {
      setError('Enter the Greek category name first.')
      return
    }

    setTranslatingCategory(true)
    setError('')
    setStatus('')

    try {
      const translation = await requestProjectTranslation(
        newCategoryName,
        '',
      )

      setNewCategoryNameEn(translation.title_en)
      setStatus('Category translated. Review the English name before saving.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setTranslatingCategory(false)
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || busy || !newCategoryName.trim()) return

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await createProductCategory({
        slug: newCategoryNameEn,
        nameEl: newCategoryName,
        nameEn: newCategoryNameEn,
        isActive: true,
      })

      setNewCategoryName('')
      setNewCategoryNameEn('')
      await refresh()
      setStatus('Category created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteProduct() {
    if (readOnly || busy || !deleteTarget) return

    const row = deleteTarget

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await deleteManagedProduct(row.id)

      if (editingId === row.id) {
        setEditingId(null)
        setDraft(emptyDraft())
        setPendingPhotos([])
      }

      setPreviewProduct(null)
      setDeleteTarget(null)
      await refresh()
      setStatus(`Product "${row.title_el}" deleted successfully.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setDeleteTarget(null)
      await refresh().catch(() => {})
    } finally {
      setBusy(false)
    }
  }
  async function togglePublished(row: ProductRow) {
    if (readOnly || busy) return

    const action = row.is_published ? 'unpublish' : 'publish'
    if (!window.confirm(`Are you sure you want to ${action} "${row.title_el}"?`)) {
      return
    }

    setBusy(true)
    setError('')
    setStatus('')

    try {
      await setProductPublished(row.id, !row.is_published)
      await refresh()
      setStatus('Publication status updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const visibleProducts = products.filter((row) => {
    const query = productSearch.trim().toLocaleLowerCase()

    const matchesSearch =
      !query ||
      row.title_el.toLocaleLowerCase().includes(query) ||
      (row.title_en ?? '').toLocaleLowerCase().includes(query) ||
      row.slug.toLocaleLowerCase().includes(query)

    const matchesStatus =
      productFilter === 'all' ||
      (productFilter === 'published' && row.is_published) ||
      (productFilter === 'draft' && !row.is_published)

    return matchesSearch && matchesStatus
  })
  return (
    <section className="portal-card admin-product-manager" style={{ marginBottom: 20 }}>
      <div className="portal-card-title-row">
        <div>
          <p className="portal-eyebrow">3D Printed Collection</p>
          <h3>Product Manager</h3>
          <p className="portal-muted">
            Manage categories, products, prices and publication.
          </p>
        </div>
        <div className="portal-chip">
          {loading ? 'Loading...' : `${products.length} products`}
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#fb7185' }}>{error}</p>}
      {status && <p role="status" style={{ color: '#86efac' }}>{status}</p>}

      <div className="product-manager-toolbar">
        <div>
          <h4>Product catalogue</h4>
          <p className="portal-muted">
            Select a product to preview, edit or manage publication.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="button button-primary"
            disabled={busy}
            onClick={() => {
              if (showProductEditor) {
                setShowProductEditor(false)
                return
              }

              setEditingId(null)
              setDraft(emptyDraft())
              setPendingPhotos([])
              setShowAdvanced(false)
              setStatus('')
              setError('')
              setShowProductEditor(true)
            }}
          >
            {showProductEditor ? 'Close editor' : '+ New product'}
          </button>
        )}
      </div>
      <div style={{ marginTop: 32 }}>
        <div className="product-manager-list-heading">
          <h4>Existing products</h4>
          <span className="portal-muted">
            {visibleProducts.length} of {products.length} products
          </span>
        </div>

        <div className="product-manager-filters">
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search by product name or slug..."
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />

          <div className="product-manager-filter-buttons">
            {([
              ['all', 'All'],
              ['published', 'Published'],
              ['draft', 'Drafts'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={productFilter === value ? 'is-active' : ''}
                aria-pressed={productFilter === value}
                onClick={() => setProductFilter(value)}
              >
                {label}
                <span>
                  {value === 'all'
                    ? products.length
                    : products.filter((row) =>
                        value === 'published' ? row.is_published : !row.is_published,
                      ).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {!loading && products.length === 0 && (
          <p className="portal-muted">No products yet. Create your first product above.</p>
        )}

        {!loading && visibleProducts.length === 0 && products.length > 0 && (
          <p className="portal-muted product-manager-no-results">
            No products match your search or selected filter.
          </p>
        )}
        {visibleProducts.map((row) => (
          <div
            key={row.id}
            className="portal-card product-manager-item"
          >
            <div className="portal-card-title-row">
              <div className="product-manager-item-info">
                <ProductManagerThumbnail
                  productId={row.id}
                  productTitle={row.title_el}
                />

                <div className="product-manager-item-copy">
                  <strong>{row.title_el}</strong>
                  <p className="product-manager-item-slug">{row.slug}</p>

                  <div className="product-manager-item-meta">
                    <span className="product-manager-item-price">
                      {row.price_eur == null
                        ? 'Ask for price'
                        : new Intl.NumberFormat('el-GR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(Number(row.price_eur))}
                    </span>

                    <span
                      className={
                        row.is_published
                          ? 'product-manager-item-status is-published'
                          : 'product-manager-item-status is-draft'
                      }
                    >
                      {row.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {!readOnly && (
                <div className="portal-actions product-manager-item-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setPreviewProduct(row)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={busy}
                    onClick={() => {
                      setShowProductEditor(true)
                      setEditingId(row.id)
                      setPendingPhotos([])
                      setDraft(draftFromRow(row))
                      setStatus('')
                      setError('')
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={busy}
                    onClick={() => void togglePublished(row)}
                  >
                    {row.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ color: '#fb7185', borderColor: 'rgba(251,113,133,.45)' }}
                    disabled={busy}
                    onClick={() => setDeleteTarget(row)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>


      {!readOnly && (
        <details
          style={{
            marginTop: 20,
            marginBottom: 24,
            padding: 16,
            border: '1px solid var(--line, rgba(255,255,255,0.15))',
            borderRadius: 12,
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            Manage product categories
          </summary>
          <form
            onSubmit={addCategory}
            style={{ marginTop: 20 }}
          >
            <h4 style={{ marginBottom: 12 }}>Add product category</h4>
          <div className="portal-actions">
            <input
              required
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Category name in Greek"
              aria-label="New category name"
              style={{ minWidth: 220 }}
            />
            <input
              required
              value={newCategoryNameEn}
              onChange={(event) => setNewCategoryNameEn(event.target.value)}
              placeholder="English name (e.g. Speaker Adapters)"
              aria-label="New category English name"
              style={{ minWidth: 240 }}
            />
            <button
              className="button button-secondary"
              type="button"
              disabled={busy || translatingCategory || !newCategoryName.trim()}
              onClick={() => void translateCategory()}
            >
              {translatingCategory ? 'Translating...' : 'Translate with DeepL'}
            </button>
            <button
              className="button button-secondary"
              disabled={busy || translatingCategory}
              type="submit"
            >
              Add category
            </button>
          </div>
          </form>
        </details>
      )}

      {showProductEditor && (
        <>
          <button
            type="button"
            className="product-editor-backdrop"
            aria-label="Close product editor"
            disabled={busy}
            onClick={() => setShowProductEditor(false)}
          />
          <div
            className="product-editor-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-editor-heading"
          >
            <div className="product-editor-panel-header">
              <div>
                <p>GLOWWORKS.LAB / PRODUCT MANAGER</p>
                <h2 id="product-editor-heading">
                  {editingId ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
                </h2>
              </div>
              <button
                type="button"
                className="product-editor-close"
                aria-label="Close product editor"
                disabled={busy}
                onClick={() => setShowProductEditor(false)}
              >
                ×
              </button>
            </div>
            <div className="product-editor-panel-body">
      <div style={{ marginTop: 16, marginBottom: 20 }}>
        {editingId ? (
          <ProductImageManager
            key={editingId}
            productId={editingId}
            readOnly={readOnly}
          />
        ) : (
          <div>
            <label>
              <span>Select product photos (JPG, PNG or WebP)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                onChange={(event) => {
                  setPendingPhotos(Array.from(event.target.files ?? []))
                }}
              />
            </label>
            <p className="portal-muted" style={{ marginTop: 10 }}>
              {pendingPhotos.length > 0
                ? `${pendingPhotos.length} photo(s) selected. They will upload when you save.`
                : 'Select photos now. They will upload automatically after saving the product.'}
            </p>
          </div>
        )}
      </div>

      {!readOnly && (
        <form onSubmit={saveProduct}>
          <div className="product-editor-translation">
            <button
              type="button"
              className="button button-secondary"
              disabled={busy || translating || !draft.titleEl.trim()}
              onClick={() => void translateProduct()}
            >
              {translating ? 'Translating...' : 'Translate to English (DeepL)'}
            </button>
          </div>
          <div className="portal-actions" style={{ marginBottom: 18 }}>
            <button
              type="button"
              className="button button-secondary"
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced((value) => !value)}
            >
              {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
            </button>
          </div>
          <div className="form-grid">
            <label>
              <span>Product title (Greek) *</span>
              <input
                required
                value={draft.titleEl}
                onChange={(event) => change('titleEl', event.target.value)}
                placeholder="Π.χ. Βάση ηχείων Toyota C-HR"
              />
            </label>

            <label style={{ display: showAdvanced ? undefined : 'none' }}>
              <span>Product title (English)</span>
              <input
                value={draft.titleEn ?? ''}
                onChange={(event) => change('titleEn', event.target.value)}
                placeholder="Toyota C-HR speaker adapter"
              />
            </label>

            <label style={{ display: showAdvanced ? undefined : 'none' }}>
              <span>URL slug (optional — generated automatically)</span>
              <input
                value={draft.slug}
                onChange={(event) => change('slug', event.target.value)}
                placeholder="toyota-chr-speaker-adapter"
                pattern="[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*"
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={draft.categoryId ?? ''}
                onChange={(event) => change('categoryId', event.target.value || null)}
              >
                <option value="">No category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name_el}{item.is_active ? '' : ' (Inactive)'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Price (€) — empty means ask for price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.priceEur ?? ''}
                onChange={(event) => change(
                  'priceEur',
                  event.target.value === '' ? null : Number(event.target.value),
                )}
                placeholder="25.00"
              />
            </label>

            <label>
              <span>Availability</span>
              <select
                value={draft.availability}
                onChange={(event) => change(
                  'availability',
                  event.target.value as ManagedProductDraft['availability'],
                )}
              >
                <option value="available">Available</option>
                <option value="made_to_order">Made to order</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>

            <label>
              <span>Description (Greek)</span>
              <textarea
                rows={4}
                value={draft.descriptionEl}
                onChange={(event) => change('descriptionEl', event.target.value)}
              />
            </label>

            <label style={{ display: showAdvanced ? undefined : 'none' }}>
              <span>Description (English)</span>
              <textarea
                rows={4}
                value={draft.descriptionEn ?? ''}
                onChange={(event) => change('descriptionEn', event.target.value)}
              />
            </label>

            <label style={{ display: showAdvanced ? undefined : 'none' }}>
              <span>Vehicle compatibility</span>
              <textarea
                rows={3}
                value={draft.vehicleCompatibility}
                onChange={(event) => change('vehicleCompatibility', event.target.value)}
                placeholder="Toyota C-HR 2017–2023"
              />
            </label>

            <label style={{ display: showAdvanced ? undefined : 'none' }}>
              <span>Display order</span>
              <input
                type="number"
                step="1"
                value={draft.sortOrder}
                onChange={(event) => change('sortOrder', Number(event.target.value))}
              />
            </label>
          </div>

          <div className="portal-actions" style={{ marginTop: 16 }}>
            <label>
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(event) => change('isFeatured', event.target.checked)}
              />
              {' '}Featured
            </label>

          </div>

          <div className="portal-actions" style={{ marginTop: 20 }}>
            <button className="button button-primary" disabled={busy} type="submit">
              {busy ? 'Saving...' : editingId ? 'Save product changes' : 'Create product'}
            </button>
          </div>
        </form>
      )}
            </div>
          </div>
        </>
      )}


      {deleteTarget && (
        <div
          role="presentation"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-description"
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#191923] p-6 text-white shadow-2xl"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#fb7185]">
              GLOWWORKS.LAB / DELETE PRODUCT
            </p>

            <h3
              id="delete-product-title"
              className="mb-4 text-2xl font-semibold uppercase"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Οριστική διαγραφή;
            </h3>

            <p
              id="delete-product-description"
              className="mb-5 text-sm leading-7 text-white/65"
            >
              Θέλεις να διαγράψεις το προϊόν
              <strong className="text-white"> {deleteTarget.title_el}</strong>;
              Θα διαγραφούν επίσης οι συνδεδεμένες φωτογραφίες του.
              Η ενέργεια δεν αναιρείται.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                disabled={busy}
                onClick={() => setDeleteTarget(null)}
              >
                Ακύρωση
              </button>

              <button
                type="button"
                className="rounded-lg bg-[#dc376f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf2d5f] disabled:opacity-50"
                disabled={busy}
                onClick={() => void confirmDeleteProduct()}
              >
                {busy ? 'Διαγραφή...' : 'Οριστική διαγραφή'}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewProduct && (
        <ProductDraftPreview
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </section>
  )
}