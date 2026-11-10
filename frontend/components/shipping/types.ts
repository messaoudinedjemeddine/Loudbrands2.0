// Types for the parcel mirror API (/api/shipping/parcels) and WhatsApp templates.

export type StatusGroup = 'READY' | 'IN_TRANSIT' | 'DONE' | 'RETURNED' | 'OTHER'

export interface ParcelOrderItem {
  quantity: number
  price: number
  size: string | null
  product: { name: string; nameAr: string | null }
  productSize: { size: string } | null
}

export interface ParcelOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  deliveryType: 'HOME_DELIVERY' | 'PICKUP'
  deliveryAddress: string | null
  deliveryDetails: { wilayaName?: string; communeName?: string; centerName?: string; [k: string]: unknown } | null
  total: number
  subtotal: number
  deliveryFee: number
  notes: string | null
  callCenterStatus: string
  deliveryStatus: string
  createdAt: string
  city: { name: string; nameAr: string | null } | null
  deliveryDesk: { name: string } | null
  items?: ParcelOrderItem[]
}

export interface Parcel {
  id: string
  tracking: string
  orderId: string | null
  yalidineOrderId: string | null
  lastStatus: string | null
  lastStatusReason: string | null
  lastStatusAt: string | null
  paymentStatus: string | null
  paymentId: string | null
  isStopdesk: boolean
  stopdeskId: number | null
  stopdeskName: string | null
  toWilayaId: number | null
  toWilayaName: string | null
  toCommuneName: string | null
  currentCenterName: string | null
  currentWilayaName: string | null
  productList: string | null
  price: number | null
  deliveryFee: number | null
  freeshipping: boolean
  hasExchange: boolean
  label: string | null
  dateCreation: string | null
  dateExpedition: string | null
  deletedAt: string | null
  lastSyncedAt: string
  order: ParcelOrder | null
}

export interface ParcelHistoryItem {
  id: string
  status: string
  reason: string | null
  occurredAt: string
  centerName: string | null
  wilayaName: string | null
  communeName: string | null
}

export interface ParcelDetail extends Parcel {
  history: ParcelHistoryItem[]
}

export interface ParcelListResponse {
  total: number
  page: number
  pageSize: number
  totalPages: number
  parcels: Parcel[]
}

export interface ParcelStats {
  total: number
  groups: Record<StatusGroup, number>
  statuses: Record<string, number>
  payments: Record<string, number>
}

export interface SyncRun {
  mode: 'full' | 'incremental'
  startedAt: string
  finishedAt: string
  ok: boolean
  parcels: number
  created: number
  linked: number
  historyRows: number
  apiCalls: number
  error?: string
}

export interface SyncState {
  running: 'full' | 'incremental' | null
  lastRun: SyncRun | null
  lastSuccessAt: string | null
}

export interface SyncReport {
  note?: string
  lastSyncAt: string | null
  totalParcelsInMirror: number
  parcelsWithoutOrder: {
    count: number
    items: Array<Pick<Parcel, 'tracking' | 'yalidineOrderId' | 'lastStatus' | 'lastStatusAt' | 'toWilayaName' | 'toCommuneName' | 'price' | 'dateCreation'>>
  }
  ordersWithUnknownTracking: {
    count: number
    items: Array<{ id: string; orderNumber: string; trackingNumber: string; customerName: string; callCenterStatus: string; deliveryStatus: string; createdAt: string }>
  }
  confirmedOrdersWithoutTracking: {
    count: number
    items: Array<{ id: string; orderNumber: string; customerName: string; customerPhone: string; createdAt: string }>
  }
}

export interface WhatsappTemplate {
  id: string
  name: string
  body: string
  statuses: string[]
  reasons: string[]
  sortOrder: number
  isActive: boolean
}

export type WhatsappTemplateInput = Omit<WhatsappTemplate, 'id'>
