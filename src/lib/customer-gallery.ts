import { supabase } from './supabase/client'
import type { AdminGalleryItem } from '../types/portal'

const CUSTOMER_GALLERY_BUCKET = 'customer-gallery-private'
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
  let uploadedNewPhoto = false

  // Preserve the existing file reference when only gallery metadata changes.
  // Never reuse a path for a different URL or customer.
  if (!item.imageUrl.startsWith('data:')) {
    const { data: existing, error: existingError } = await supabase
      .from('customer_gallery')
      .select('customer_id, image_url, storage_path')
      .eq('id', item.id)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing && String(existing.customer_id) !== item.customerId) {
      throw new Error('Cannot move a gallery photo between customers.')
    }

    if (existing && String(existing.image_url ?? '') === item.imageUrl) {
      storagePath = existing.storage_path ? String(existing.storage_path) : null
    }
  }

  if (item.imageUrl.startsWith('data:')) {
    const blob = await dataUrlToBlob(item.imageUrl)

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(blob.type)) {
      throw new Error('Use a JPEG, PNG, WebP or AVIF photo.')
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

    uploadedNewPhoto = true
    imageUrl = ''
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
    if (uploadedNewPhoto && storagePath) {
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
      'id, customer_id, title, description, category, featured, created_at',
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
    imageUrl: '',
    category: String(row.category ?? 'customer'),
    featured: Boolean(row.featured),
  }))
}

export async function deleteCustomerGalleryItem(itemId: string) {
  if (!itemId) {
    throw new Error('Gallery photo ID is required.')
  }

  const { data, error: readError } = await supabase
    .from('customer_gallery')
    .select('id, customer_id, storage_path, image_url')
    .eq('id', itemId)
    .maybeSingle()

  if (readError) throw readError
  if (!data) throw new Error('Gallery photo not found.')

  const customerId = String(data.customer_id)
  const storagePath = String(data.storage_path ?? '')
  const imageUrl = String(data.image_url ?? '')

  if (
    !storagePath.startsWith(`customer-gallery/${customerId}/`) ||
    storagePath.includes('..') ||
    imageUrl !== ''
  ) {
    throw new Error(
      'Legacy gallery deletion is disabled until public storage migration is complete.',
    )
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from('customer_gallery')
    .delete()
    .eq('id', itemId)
    .eq('customer_id', customerId)
    .select('id')

  if (deleteError) throw deleteError

  if (!deletedRows || deletedRows.length !== 1) {
    throw new Error('Gallery photo was not deleted from the database.')
  }

  const { error: storageError } = await supabase.storage
    .from(CUSTOMER_GALLERY_BUCKET)
    .remove([storagePath])

  if (storageError) {
    console.error('Private gallery Storage cleanup failed', {
      itemId,
      storagePath,
      error: storageError,
    })

    throw new Error(
      'Database row deleted, but private Storage cleanup failed. Manual cleanup required.',
    )
  }
}

const PRIVATE_PREVIEW_BUCKET = 'customer-gallery-private'
const PRIVATE_PREVIEW_TTL_SECONDS = 600

export async function fetchPrivateGalleryPreviewUrls(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('customer_gallery')
    .select('id, customer_id, storage_path')
    .not('storage_path', 'is', null)

  if (error) throw error

  const rows = (data ?? []).filter((row) => {
    const path = String(row.storage_path ?? '')
    return path.startsWith(`customer-gallery/${row.customer_id}/`)
  })

  if (!rows.length) return {}

  const paths = rows.map((row) => String(row.storage_path))

  const { data: signed, error: signError } = await supabase.storage
    .from(PRIVATE_PREVIEW_BUCKET)
    .createSignedUrls(paths, PRIVATE_PREVIEW_TTL_SECONDS)

  if (signError) throw signError

  const urls: Record<string, string> = {}

  rows.forEach((row, index) => {
    const signedUrl = signed?.[index]?.signedUrl
    if (signedUrl) urls[String(row.id)] = signedUrl
  })

  return urls
}
