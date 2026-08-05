import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('p')

    if (redirectPath && redirectPath !== window.location.pathname) {
      window.history.replaceState({}, '', redirectPath)
    }
  }

  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
}
