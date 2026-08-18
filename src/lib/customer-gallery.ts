import { supabase } from './supabase/client'
import type { AdminGalleryItem } from '../types/portal'

const CUSTOMER_GALLERY_BUCKET = 'project-media'
const MAX_IMAGE_SIZE = 15 * 1024 * 1024

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/avif':
      return 'avif'
    default:
      return 'jpg'
  }
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function saveCustomerGalleryItem(
  item: AdminGalleryItem,
): Promise<AdminGalleryItem> {
  if (!item.customerId) {
    throw new Error('Customer ID is required for gallery photos.')
  }

  let imageUrl = item.imageUrl
  let storagePath: string | null = null

  if (item.imageUrl.startsWith('data:')) {
    const blob = await dataUrlToBlob(item.imageUrl)

    if (!blob.type.startsWith('image/')) {
      throw new Error('Selected file is not an image.')
    }

    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error('Image is larger than 15 MB.')
    }

    const extension = extensionFromMimeType(blob.type)

    storagePath =
      `customer-gallery/${item.customerId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(CUSTOMER_GALLERY_BUCKET)
      .upload(storagePath, blob, {
        cacheControl: '3600',
        contentType: blob.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    imageUrl = supabase.storage
      .from(CUSTOMER_GALLERY_BUCKET)
      .getPublicUrl(storagePath).data.publicUrl
  }

  const savedItem: AdminGalleryItem = {
    ...item,
    imageUrl,
  }

  const { error } = await supabase
    .from('customer_gallery')
    .upsert(
      {
        id: savedItem.id,
        customer_id: savedItem.customerId,
        title: savedItem.title,
        description: savedItem.description,
        image_url: savedItem.imageUrl,
        storage_path: storagePath,
        category: savedItem.category,
        featured: savedItem.featured,
      },
      {
        onConflict: 'id',
      },
    )

  if (error) {
    if (storagePath) {
      await supabase.storage
        .from(CUSTOMER_GALLERY_BUCKET)
        .remove([storagePath])
    }

    throw error
  }

  return savedItem
}

export async function fetchCustomerGallery(
  customerId?: string,
): Promise<AdminGalleryItem[]> {
  let query = supabase
    .from('customer_gallery')
    .select(
      'id, customer_id, title, description, image_url, category, featured, created_at',
    )
    .order('created_at', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url ?? ''),
    category: String(row.category ?? 'customer'),
    featured: Boolean(row.featured),
  }))
}

export async function deleteCustomerGalleryItem(itemId: string) {
  const { data, error: readError } = await supabase
    .from('customer_gallery')
    .select('storage_path')
    .eq('id', itemId)
    .maybeSingle()

  if (readError) {
    throw readError
  }

  const storagePath = data?.storage_path
    ? String(data.storage_path)
    : ''

  const { error } = await supabase
    .from('customer_gallery')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw error
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(CUSTOMER_GALLERY_BUCKET)
      .remove([storagePath])

    if (storageError) {
      console.warn(
        'Gallery database row deleted but Storage cleanup failed',
        storageError,
      )
    }
  }
}
