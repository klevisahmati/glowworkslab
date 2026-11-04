import { supabase } from './supabase/client'

const BUCKET = 'product-images'
const MAX_IMAGE_SIZE = 15 * 1024 * 1024
const SIGNED_URL_SECONDS = 600

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

type ImageRow = {
  id: string
  product_id: string
  storage_path: string
  alt_text: string
  sort_order: number
  is_cover: boolean
}

export type ManagedProductImage = ImageRow & {
  signedUrl: string
}

export async function fetchManagedProductImages(
  productId: string,
): Promise<ManagedProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('id,product_id,storage_path,alt_text,sort_order,is_cover')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as ImageRow[]

  if (!rows.length) return []

  const paths = rows.map((row) => row.storage_path)

  const { data: signed, error: signedError } =
    await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS)

  if (signedError) throw signedError

  return rows
    .map((row, index) => ({
      ...row,
      signedUrl: signed?.[index]?.signedUrl ?? '',
    }))
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
      return a.sort_order - b.sort_order
    })
}

export async function uploadProductImages(
  productId: string,
  files: File[],
) {
  if (!productId || !files.length) return

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(
        `${file.name}: only JPEG, PNG and WebP files are supported.`,
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        `${file.name}: maximum image size is 15 MB.`,
      )
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('product_images')
    .select('sort_order,is_cover')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })

  if (existingError) throw existingError

  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  let needsCover = !existing?.some((item) => item.is_cover)

  for (const file of files) {
    const extension =
      file.type === 'image/jpeg' ? 'jpg'
      : file.type === 'image/png' ? 'png'
      : 'webp'

    const storagePath =
      `${productId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: storagePath,
        alt_text: '',
        sort_order: nextOrder,
        is_cover: needsCover,
      })

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw insertError
    }

    nextOrder += 1
    needsCover = false
  }
}

export async function setProductImageCover(
  productId: string,
  imageId: string,
) {
  const { data: target, error: targetError } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('id', imageId)
    .maybeSingle()

  if (targetError) throw targetError
  if (!target) throw new Error('Image not found.')

  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_cover: false })
    .eq('product_id', productId)
    .eq('is_cover', true)

  if (clearError) throw clearError

  const { error: coverError } = await supabase
    .from('product_images')
    .update({ is_cover: true })
    .eq('product_id', productId)
    .eq('id', imageId)

  if (coverError) throw coverError
}

export async function deleteProductImage(
  image: ManagedProductImage,
) {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([image.storage_path])

  if (storageError) throw storageError

  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', image.product_id)
    .eq('id', image.id)

  if (deleteError) throw deleteError

  if (image.is_cover) {
    const { data: next, error: nextError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextError) throw nextError

    if (next) {
      await setProductImageCover(image.product_id, next.id)
    }
  }
}