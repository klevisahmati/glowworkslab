import { createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('p')

    if (redirectPath && redirectPath !== window.location.pathname) {
      window.history.replaceState({}, '', redirectPath)
    }
  }

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  return router
}
