import { supabase } from './supabase/client'
import type {
  ProductCategory,
  ProductImage,
  ProductRecord,
  ProductAvailability,
} from '../types/products'

const PRODUCT_BUCKET = 'product-images'
const SIGNED_URL_SECONDS = 600

type CategoryRow = {
  id: string
  slug: string
  name_el: string
  name_en: string | null
  description_el: string
  description_en: string | null
  sort_order: number
}

type ImageRow = {
  id: string
  storage_path: string
  alt_text: string
  sort_order: number
  is_cover: boolean
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
  availability: ProductAvailability
  vehicle_compatibility: string
  is_featured: boolean
  sort_order: number
  created_at: string
  product_categories: CategoryRow | null
  product_images: ImageRow[] | null
}

function mapCategory(row: CategoryRow): ProductCategory {
  return {
    id: row.id,
    slug: row.slug,
    nameEl: row.name_el,
    nameEn: row.name_en,
    descriptionEl: row.description_el,
    descriptionEn: row.description_en,
    sortOrder: row.sort_order,
  }
}

async function mapProducts(
  rows: ProductRow[],
): Promise<ProductRecord[]> {
  const paths = [
    ...new Set(
      rows.flatMap((row) =>
        (row.product_images ?? []).map((image) => image.storage_path),
      ),
    ),
  ]

  const urls = new Map<string, string>()

  if (paths.length) {
    const { data, error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS)

    if (error) throw error

    for (let i = 0; i < paths.length; i++) {
      const signedUrl = data?.[i]?.signedUrl

      if (signedUrl) {
        urls.set(paths[i], signedUrl)
      }
    }
  }

  return rows.map((row) => {
    const images: ProductImage[] = (row.product_images ?? [])
      .map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        signedUrl: urls.get(image.storage_path) ?? '',
        altText: image.alt_text,
        sortOrder: image.sort_order,
        isCover: image.is_cover,
      }))
      .filter((image) => Boolean(image.signedUrl))
      .sort((a, b) => {
        if (a.isCover !== b.isCover) return a.isCover ? -1 : 1
        return a.sortOrder - b.sortOrder
      })

    return {
      id: row.id,
      slug: row.slug,
      categoryId: row.category_id,
      titleEl: row.title_el,
      titleEn: row.title_en,
      descriptionEl: row.description_el,
      descriptionEn: row.description_en,
      priceEur:
        row.price_eur === null ? null : Number(row.price_eur),
      availability: row.availability,
      vehicleCompatibility: row.vehicle_compatibility,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      category: row.product_categories
        ? mapCategory(row.product_categories)
        : null,
      images,
    }
  })
}

const PRODUCT_SELECT = `
  id,
  slug,
  category_id,
  title_el,
  title_en,
  description_el,
  description_en,
  price_eur,
  availability,
  vehicle_compatibility,
  is_featured,
  sort_order,
  created_at,
  product_categories (
    id,
    slug,
    name_el,
    name_en,
    description_el,
    description_en,
    sort_order
  ),
  product_images (
    id,
    storage_path,
    alt_text,
    sort_order,
    is_cover
  )
`

export async function fetchProductCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select(
      'id,slug,name_el,name_en,description_el,description_en,sort_order',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return ((data ?? []) as CategoryRow[]).map(mapCategory)
}

export async function fetchPublishedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  return mapProducts((data ?? []) as ProductRow[])
}

export async function fetchPublishedProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const products = await mapProducts([data as ProductRow])
  return products[0] ?? null
}