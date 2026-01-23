import { RedirectToAdmin } from '@/components/redirect-to-admin'

export default function ConfirmatriceDashboardPage() {
  return (
    <RedirectToAdmin 
      tab="order-confirmation" 
      role="CONFIRMATRICE" 
      title="Order Confirmation" 
    />
  )
}
