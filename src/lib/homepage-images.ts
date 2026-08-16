import { supabase } from './supabase/client'

const HOMEPAGE_MEDIA_BUCKET = 'project-media'
const MAX_HOMEPAGE_IMAGE_SIZE = 15 * 1024 * 1024

export type HomepageImageSlot =
  | 'hero'
  | 'ambient-lighting'
  | 'custom-steering'
  | 'starlight-headliner'
  | 'android-display'
  | 'body-kit'

export type HomepageImageRecord = {
  slot: HomepageImageSlot
  storagePath: string
  publicUrl: string
  altText: string
  updatedAt: string
}

type HomepageImageRow = {
  slot: HomepageImageSlot
  storage_path: string
  alt_text: string
  updated_at: string
}

function getPublicImageUrl(storagePath: string, updatedAt: string) {
  const publicUrl = supabase.storage
    .from(HOMEPAGE_MEDIA_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl

  return `${publicUrl}?v=${new Date(updatedAt).getTime()}`
}

function mapHomepageImage(row: HomepageImageRow): HomepageImageRecord {
  return {
    slot: row.slot,
    storagePath: row.storage_path,
    publicUrl: getPublicImageUrl(row.storage_path, row.updated_at),
    altText: row.alt_text,
    updatedAt: row.updated_at,
  }
}

function safeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function fetchHomepageImages() {
  const { data, error } = await supabase
    .from('homepage_images')
    .select('slot, storage_path, alt_text, updated_at')

  if (error) {
    throw error
  }

  return ((data ?? []) as HomepageImageRow[]).map(mapHomepageImage)
}

export async function uploadHomepageImage(
  slot: HomepageImageSlot,
  file: File,
  altText: string,
) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image.`)
  }

  if (file.size > MAX_HOMEPAGE_IMAGE_SIZE) {
    throw new Error(`${file.name} is larger than 15 MB.`)
  }

  const { data: existingImage, error: existingImageError } = await supabase
    .from('homepage_images')
    .select('storage_path')
    .eq('slot', slot)
    .maybeSingle()

  if (existingImageError) {
    throw existingImageError
  }

  const storagePath =
    `homepage/${slot}/${crypto.randomUUID()}-${safeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(HOMEPAGE_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const updatedAt = new Date().toISOString()

  const { data, error: databaseError } = await supabase
    .from('homepage_images')
    .upsert(
      {
        slot,
        storage_path: storagePath,
        alt_text: altText.trim(),
        updated_at: updatedAt,
      },
      { onConflict: 'slot' },
    )
    .select('slot, storage_path, alt_text, updated_at')
    .single()

  if (databaseError) {
    await supabase.storage
      .from(HOMEPAGE_MEDIA_BUCKET)
      .remove([storagePath])

    throw databaseError
  }

  const previousStoragePath =
    (existingImage as { storage_path?: string } | null)?.storage_path

  if (previousStoragePath && previousStoragePath !== storagePath) {
    const { error: removalError } = await supabase.storage
      .from(HOMEPAGE_MEDIA_BUCKET)
      .remove([previousStoragePath])

    if (removalError) {
      console.warn('Could not remove the previous homepage image', removalError)
    }
  }

  return mapHomepageImage(data as HomepageImageRow)
}