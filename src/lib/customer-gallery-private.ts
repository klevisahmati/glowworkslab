/**
 * Issue short-lived customer photo URLs server-side.
 * NFC customer codes act as bearer credentials: treat them as private.
 * Never expose the service-role key or raw Storage paths to the browser.
 */
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'

const PRIVATE_BUCKET = 'customer-gallery-private'
const URL_TTL_SECONDS = 300
const CUSTOMER_CODE_FORMAT = /^gwl_[a-z0-9]{10,64}$/

type SignedCustomerPhoto = {
  id: string
  signedUrl: string
  expiresIn: number
}

export const getPrivateCustomerPhotoUrls = createServerFn({ method: 'POST' })
  .validator((input: { customerCode: string }) => {
    if (!input || typeof input.customerCode !== 'string') {
      throw new Error('Invalid customer code.')
    }
    const code = input.customerCode.trim().toLowerCase()
    if (!CUSTOMER_CODE_FORMAT.test(code)) {
      throw new Error('Invalid customer code.')
    }
    return { customerCode: code }
  })
  .handler(async ({ data }): Promise<SignedCustomerPhoto[]> => {
    // Server runtime only. Do not use a VITE_ prefix for secret keys.
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Private gallery server configuration is incomplete.')
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Never trust a customer ID or object path passed in from the browser.
    const { data: customer, error: customerError } = await adminClient
      .from('costumers')
      .select('id')
      .eq('costumer_id', data.customerCode)
      .or('status.eq.active,status.is.null')
      .maybeSingle()
    if (customerError) throw new Error('Private gallery lookup failed.')
    if (!customer) return []

    const customerId = String(customer.id)
    const prefix = `customer-gallery/${customerId}/`
    const { data: photos, error: photoError } = await adminClient
      .from('customer_gallery')
      .select('id, storage_path')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (photoError) throw new Error('Private gallery lookup failed.')

    const valid = (photos ?? []).filter((photo) => {
      const path = photo.storage_path
      return typeof path === 'string'
        && path.startsWith(prefix)
        && !path.includes('..')
        && !path.includes('\\')
    })
    if (!valid.length) return []

    const { data: signed, error: signError } = await adminClient.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrls(valid.map((photo) => String(photo.storage_path)), URL_TTL_SECONDS)
    if (signError) throw new Error('Private gallery signing failed.')

    return valid.flatMap((photo, index): SignedCustomerPhoto[] => {
      const signedUrl = signed?.[index]?.signedUrl
      if (!signedUrl) return []
      return [{ id: String(photo.id), signedUrl, expiresIn: URL_TTL_SECONDS }]
    })
  })
