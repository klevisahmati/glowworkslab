export type CustomerPortalLinkKind = 'nfc' | 'qr' | 'portal'

export interface CustomerPortalLinkOptions {
  baseUrl?: string
  kind?: CustomerPortalLinkKind
}

function normalizeCustomerCode(customerCode: string) {
  const value = customerCode.trim()
  return value || 'GWL-000001'
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
