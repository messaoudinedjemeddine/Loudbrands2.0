export type GroupBy = 'day' | 'week' | 'month' | 'year'

export interface Totals {
  revenue: number
  cost: number
  profit: number
  margin: number
  deliveredOrders: number
  returnedOrders: number
  returnedValue: number
  itemsSold: number
  averageOrder: number
  deliveryRate: number | null
  costMissingItems: number
}

export interface MoneyRow {
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface AnalyticsOverview {
  period: { from: string; to: string; days: number; groupBy: GroupBy; previous: { from: string; to: string } }
  totals: Totals
  previous: Totals
  orders: { created: number; confirmed: number; canceled: number }
  pipeline: { orders: number; value: number }
  series: Array<{ bucket: string; revenue: number; cost: number; profit: number; delivered: number; returned: number }>
  topProducts: Array<MoneyRow & { id: string; name: string; qty: number; costMissing: boolean }>
  categories: Array<MoneyRow & { name: string; qty: number }>
  wilayas: Array<{ name: string; delivered: number; returned: number; revenue: number; deliveryRate: number | null }>
}

export interface ProfitProduct {
  id: string
  name: string
  reference: string | null
  category: string
  image: string | null
  price: number
  costPrice: number
  unitProfit: number
  unitMargin: number | null
  costMissing: boolean
  stock: number
  stockCostValue: number
  stockRetailValue: number
  sold: number
  revenue: number
  cost: number
  profit: number
  margin: number | null
}

export interface ProfitReport {
  period: { from: string; to: string; days: number }
  totals: Totals
  stock: { units: number; costValue: number; retailValue: number }
  productsWithoutCost: number
  categories: Array<{ name: string; products: number; sold: number; revenue: number; cost: number; profit: number; margin: number | null }>
  products: ProfitProduct[]
}
