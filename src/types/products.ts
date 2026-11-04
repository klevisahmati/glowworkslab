export type ProductAvailability =
  | 'available'
  | 'made_to_order'
  | 'out_of_stock'

export interface ProductCategory {
  id: string
  slug: string
  nameEl: string
  nameEn: string | null
  descriptionEl: string
  descriptionEn: string | null
  sortOrder: number
}

export interface ProductImage {
  id: string
  storagePath: string
  signedUrl: string
  altText: string
  sortOrder: number
  isCover: boolean
}

export interface ProductRecord {
  id: string
  slug: string
  categoryId: string | null
  titleEl: string
  titleEn: string | null
  descriptionEl: string
  descriptionEn: string | null
  priceEur: number | null
  availability: ProductAvailability
  vehicleCompatibility: string
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  category: ProductCategory | null
  images: ProductImage[]
}