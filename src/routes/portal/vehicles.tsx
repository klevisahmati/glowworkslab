import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/vehicles')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/portal/vehicles"!</div>
}
