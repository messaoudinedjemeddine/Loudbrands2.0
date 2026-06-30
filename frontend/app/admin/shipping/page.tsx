'use client'

import { ShippingDashboard } from '@/components/admin/shipping-dashboard';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminShippingPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion d'Expédition</h1>
          <p className="text-muted-foreground">
            Gérez les commandes confirmées et créez des expéditions Yalidine
          </p>
        </div>
        
        <ShippingDashboard />
      </div>
    </AdminLayout>
  );
} 