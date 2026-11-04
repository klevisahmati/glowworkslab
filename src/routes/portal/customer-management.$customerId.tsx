import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from './admin'

export const Route = createFileRoute('/portal/customer-management/$customerId')({
  component: CustomerManagementRoute,
})

function CustomerManagementRoute() {
  const { customerId } = Route.useParams()
  return <AdminPage customerRouteId={customerId} />
}
