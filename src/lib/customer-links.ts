export type CustomerPortalLinkKind = 'nfc' | 'qr' | 'portal'

export interface CustomerPortalLinkOptions {
  baseUrl?: string
  kind?: CustomerPortalLinkKind
}

export function generateSecureCustomerPortalSlug(existingCodes: string[] = []) {
  const prefix = 'gwl_'
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10).toLowerCase()
    : Math.random().toString(36).slice(2, 12)

  let slug = `${prefix}${randomPart}`
  let attempts = 0

  while (existingCodes.some((code) => code.trim().toLowerCase() === slug.toLowerCase()) && attempts < 10) {
    attempts += 1
    slug = `${prefix}${Math.random().toString(36).slice(2, 12)}`
  }

  return slug
}

function normalizeCustomerCode(customerCode: string) {
  const value = customerCode.trim()
  return value || generateSecureCustomerPortalSlug()
}

export function buildCustomerPortalPath(customerCode: string) {
  return `/customer/${encodeURIComponent(normalizeCustomerCode(customerCode))}`
}

export function buildCustomerPortalUrl(customerCode: string, options: CustomerPortalLinkOptions = {}) {
  const baseUrl = options.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://glowworks.lab')
  return `${baseUrl}${buildCustomerPortalPath(customerCode)}`
}

export function getCustomerPortalLink(customerCode: string, options: CustomerPortalLinkOptions = {}) {
  return buildCustomerPortalUrl(customerCode, options)
}
