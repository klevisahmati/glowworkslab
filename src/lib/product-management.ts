import { supabase } from './supabase/client'
import type { ProductAvailability } from '../types/products'

export interface ProductCategoryDraft {
  slug: string
  nameEl: string
  nameEn?: string | null
  descriptionEl?: string
  descriptionEn?: string | null
  isActive?: boolean
  sortOrder?: number
}

export interface ManagedProductDraft {
  slug: string
  categoryId: string | null
  titleEl: string
  titleEn?: string | null
  descriptionEl: string
  descriptionEn?: string | null
  priceEur: number | null
  availability: ProductAvailability
  vehicleCompatibility: string
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
}

const GREEK_SLUG_CHARS: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e',
  ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k',
  λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o',
  π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't',
  υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
}

export function createProductSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[α-ω]/g, (letter) => GREEK_SLUG_CHARS[letter] ?? '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function categoryPayload(draft: ProductCategoryDraft) {
  const slug = createProductSlug(draft.slug || draft.nameEl)

  if (!slug || !draft.nameEl.trim()) {
    throw new Error('Category name and slug are required.')
  }

  return {
    slug,
    name_el: draft.nameEl.trim(),
    name_en: draft.nameEn?.trim() || null,
    description_el: draft.descriptionEl?.trim() || '',
    description_en: draft.descriptionEn?.trim() || null,
    is_active: draft.isActive ?? true,
    sort_order: draft.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  }
}

function productPayload(draft: ManagedProductDraft) {
  const slug = createProductSlug(draft.slug || draft.titleEl)

  if (!slug || !draft.titleEl.trim()) {
    throw new Error('Product title and slug are required.')
  }

  if (
    draft.priceEur !== null &&
    (!Number.isFinite(draft.priceEur) || draft.priceEur < 0)
  ) {
    throw new Error('Product price must be a valid positive amount.')
  }

  return {
    slug,
    category_id: draft.categoryId || null,
    title_el: draft.titleEl.trim(),
    title_en: draft.titleEn?.trim() || null,
    description_el: draft.descriptionEl.trim(),
    description_en: draft.descriptionEn?.trim() || null,
    price_eur: draft.priceEur,
    availability: draft.availability,
    vehicle_compatibility: draft.vehicleCompatibility.trim(),
    is_published: draft.isPublished,
    is_featured: draft.isFeatured,
    sort_order: draft.sortOrder,
    updated_at: new Date().toISOString(),
  }
}

export async function fetchManagedCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createProductCategory(
  draft: ProductCategoryDraft,
) {
  const { data, error } = await supabase
    .from('product_categories')
    .insert(categoryPayload(draft))
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function updateProductCategory(
  id: string,
  draft: ProductCategoryDraft,
) {
  const { error } = await supabase
    .from('product_categories')
    .update(categoryPayload(draft))
    .eq('id', id)

  if (error) throw error
}

export async function fetchManagedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createManagedProduct(
  draft: ManagedProductDraft,
) {
  const { data, error } = await supabase
    .from('products')
    .insert(productPayload(draft))
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function updateManagedProduct(
  id: string,
  draft: ManagedProductDraft,
) {
  const { error } = await supabase
    .from('products')
    .update(productPayload(draft))
    .eq('id', id)

  if (error) throw error
}

export async function setProductPublished(
  id: string,
  published: boolean,
) {
  const { error } = await supabase
    .from('products')
    .update({
      is_published: published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}
/**
 * Delete a product and clean up its private Storage images.
 * Database deletion must be permitted by RLS and foreign-key rules.
 * Storage cleanup happens only after confirmed database deletion.
 */
export async function deleteManagedProduct(
  productId: string,
): Promise<void> {
  if (!productId.trim()) {
    throw new Error('Missing product ID.')
  }

  const { data: imageRows, error: imagesError } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId)

  if (imagesError) throw imagesError

  const paths = [...new Set(
    (imageRows ?? [])
      .map((image) => image.storage_path)
      .filter((path): path is string => Boolean(path)),
  )]

  const { data: deleted, error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .select('id')

  if (deleteError) throw deleteError

  if (!deleted || deleted.length !== 1) {
    throw new Error(
      'Product was not deleted. Check administrator permissions and database policies.',
    )
  }

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove(paths)

    if (storageError) {
      throw new Error(
        'Product deleted from database, but Storage cleanup failed. ' +
        'Remaining paths: ' + paths.join(', ') +
        '. Error: ' + storageError.message,
      )
    }
  }
}