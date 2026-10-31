import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/build')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})