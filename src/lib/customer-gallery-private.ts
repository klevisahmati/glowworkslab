/**
 * Step 110K.1: private-gallery signed URLs (server-only preparation).
 * This module is intentionally NOT wired into the customer portal yet.
 * Never return a Storage path or a service-role credential to the browser.
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

    const results: SignedCustomerPhoto[] = []
    for (const photo of photos ?? []) {
      const path = photo.storage_path
      if (typeof path !== 'string' || !path.startsWith(prefix)) continue
      // Only issue URLs for objects that actually exist in the private bucket.
      const { data: urlData, error: signError } = await adminClient.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(path, URL_TTL_SECONDS)
      if (signError || !urlData?.signedUrl) continue
      results.push({
        id: String(photo.id),
        signedUrl: urlData.signedUrl,
        expiresIn: URL_TTL_SECONDS,
      })
    }
    return results
  })
