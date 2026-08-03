import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/claims')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/portal/claims"!</div>
}
