export interface ZakatAuto {
  period: { from: string; to: string; days: number }
  stockValue: number
  stockUnits: number
  productsWithoutCost: number
  salesValue: number
  deliveredOrders: number
  itemsSold: number
}

export interface ZakatInput {
  periodFrom: string
  periodTo: string
  stockValue: number
  salesValue: number
  ateliers: number
  salaries: number
  otherCharges: number
  goldPricePerGram: number
  notes?: string
}

export interface ZakatCalculation {
  id: string
  periodFrom: string
  periodTo: string
  stockValue: number
  salesValue: number
  ateliers: number
  salaries: number
  otherCharges: number
  goldPricePerGram: number
  nisab: number
  base: number
  rate: number
  zakatDue: number
  notes: string | null
  isPaid: boolean
  paidAt: string | null
  createdAt: string
}
