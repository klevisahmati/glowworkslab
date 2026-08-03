import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/portal/dashboard"!</div>
}
