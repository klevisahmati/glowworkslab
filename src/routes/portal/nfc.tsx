import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/nfc')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/portal/nfc"!</div>
}
