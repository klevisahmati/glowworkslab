import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/portal/profile"!</div>
}
