import { getUser, login, logout, type User } from '@netlify/identity'

const STORAGE_KEY = 'glowworks.portal.role'

export class AdminRoleRequiredError extends Error {
  constructor() {
    super('This account does not have administrator access.')
    this.name = 'AdminRoleRequiredError'
  }
}

export function isAdminUser(user: User | null) {
  return Boolean(user && (user.role === 'admin' || user.roles?.includes('admin')))
}

export async function authenticateAdmin(email: string, password: string) {
  const user = await login(email.trim().toLowerCase(), password)

  if (!isAdminUser(user)) {
    await logout()
    clearStoredPortalRole()
    throw new AdminRoleRequiredError()
  }

  setStoredPortalRole('admin')
  return user
}

export async function getAuthenticatedAdmin() {
  const user = await getUser()
  if (!isAdminUser(user)) {
    clearStoredPortalRole()
    return null
  }

  setStoredPortalRole('admin')
  return user
}

export async function hasValidAdminSession() {
  return Boolean(await getAuthenticatedAdmin())
}

export async function logoutAdminSession() {
  try {
    await logout()
  } finally {
    clearStoredPortalRole()
  }
}

export function getStoredPortalRole() {
  if (typeof window === 'undefined') {
    return null
  }

  const role = window.localStorage.getItem(STORAGE_KEY)
  return role === 'admin' ? 'admin' : role === 'customer' ? 'customer' : null
}

export function setStoredPortalRole(role: 'admin' | 'customer') {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, role)
  }
}

export function clearStoredPortalRole() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}
