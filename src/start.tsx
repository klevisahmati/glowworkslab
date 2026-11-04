import { createStart, createCsrfMiddleware } from '@tanstack/react-start'
import { getRouter } from './router'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  getRouter,
  requestMiddleware: [csrfMiddleware],
}))