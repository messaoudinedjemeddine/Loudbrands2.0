import { api } from './api';

// Types for Yalidine API
export interface Wilaya {
  id: number;
  name: string;
  zone: number;
  is_deliverable: boolean;
}

export interface Commune {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name: string;
  has_stop_desk: boolean;
  is_deliverable: boolean;
  delivery_time_parcel: number;
  delivery_time_payment: number;
}

export interface Center {
  center_id: number;
  name: string;
  address: string;
  gps: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
}

export interface DeliveryOptions {
  express: {
    home: number;
    desk: number;
  };
  economic: {
    home: number | null;
    desk: number | null;
  };
}

export interface ShippingFees {
  fromWilaya: string;
  toWilaya: string;
  zone: number;
  weightFees: number;
  codFees: number;
  deliveryOptions: DeliveryOptions;
  billableWeight: number;
  oversizeFee: number;
  codPercentage: number;
  insurancePercentage: number;
  returnFee: number;
}

export interface ShipmentData {
  orderId: string;
  firstname: string;
  familyname: string;
  contactPhone: string;
  address: string;
  fromWilayaName: string;
  toWilayaName: string;
  toCommuneName: string;
  productList: string;
  price: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  isStopDesk?: boolean;
  stopDeskId?: number;
  doInsurance?: boolean;
  declaredValue?: number;
  freeshipping?: boolean;
  hasExchange?: boolean;
  productToCollect?: string;
}

export interface ShipmentResult {
  success: boolean;
  tracking: string;
  orderId: string;
  label: string;
  importId: number;
}

export interface TrackingHistory {
  date_status: string;
  tracking: string;
  status: string;
  reason: string;
  center_id: number;
  center_name: string;
  wilaya_id: number;
  wilaya_name: string;
  commune_id: number;
  commune_name: string;
}

export interface YalidineStatus {
  configured: boolean;
  message: string;
}

class YalidineAPI {
  // Check if Yalidine is configured
  async getStatus(): Promise<YalidineStatus> {
    return api.shipping.getStatus() as Promise<YalidineStatus>;
  }

  // Get all wilayas
  async getWilayas(): Promise<{ data: Wilaya[]; has_more: boolean; total_data: number }> {
    return api.shipping.getWilayas() as Promise<{ data: Wilaya[]; has_more: boolean; total_data: number }>;
  }

  // Get communes by wilaya
  async getCommunes(wilayaId?: number): Promise<{ data: Commune[]; has_more: boolean; total_data: number }> {
    return api.shipping.getCommunes(wilayaId) as Promise<{ data: Commune[]; has_more: boolean; total_data: number }>;
  }

  // Get pickup centers
  async getCenters(wilayaId?: number): Promise<{ data: Center[]; has_more: boolean; total_data: number }> {
    return api.shipping.getCenters(wilayaId) as Promise<{ data: Center[]; has_more: boolean; total_data: number }>;
  }

  // Calculate shipping fees
  async calculateFees(data: {
    fromWilayaId: number;
    toWilayaId: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    declaredValue?: number;
  }): Promise<ShippingFees> {
    return api.shipping.calculateFees(data) as Promise<ShippingFees>;
  }

  // Create shipment
  async createShipment(data: ShipmentData): Promise<ShipmentResult> {
    return api.shipping.createShipment(data) as Promise<ShipmentResult>;
  }

  // Get shipment details
  async getShipment(tracking: string): Promise<any> {
    return api.shipping.getShipment(tracking);
  }

  // Get tracking history
  async getTracking(tracking: string): Promise<{ data: TrackingHistory[]; has_more: boolean; total_data: number }> {
    return api.shipping.getTracking(tracking) as Promise<{ data: TrackingHistory[]; has_more: boolean; total_data: number }>;
  }

  // Update shipment
  async updateShipment(tracking: string, data: Partial<ShipmentData>): Promise<any> {
    return api.shipping.updateShipment(tracking, data);
  }

  // Delete shipment
  async deleteShipment(tracking: string): Promise<any> {
    return api.shipping.deleteShipment(tracking);
  }

  // Get all shipments
  async getAllShipments(filters?: {
    status?: string;
    tracking?: string;
    order_id?: string;
    to_wilaya_id?: number;
    to_commune_name?: string;
    is_stopdesk?: boolean;
    freeshipping?: boolean;
    date_creation?: string;
    date_last_status?: string;
    payment_status?: string;
    month?: string;
    page?: number;
  }): Promise<{ data: any[]; has_more: boolean; total_data: number }> {
    return api.shipping.getAllShipments(filters) as Promise<{ data: any[]; has_more: boolean; total_data: number }>;
  }

  // Get shipment statistics
  async getShipmentStats(): Promise<{
    enPreparation: number;
    centre: number;
    versWilaya: number;
    sortiEnLivraison: number;
    livre: number;
    echecLivraison: number;
    retourARetirer: number;
    retourneAuVendeur: number;
    echangeEchoue: number;
    totalShipments: number;
  }> {
    return api.shipping.getShipmentStats() as Promise<{
      enPreparation: number;
      centre: number;
      versWilaya: number;
      sortiEnLivraison: number;
      livre: number;
      echecLivraison: number;
      retourARetirer: number;
      retourneAuVendeur: number;
      echangeEchoue: number;
      totalShipments: number;
    }>;
  }

  // Utility methods
  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^0[5-7][0-9]{8}$/; // Mobile: 05xxxxxxxx, 06xxxxxxxx, 07xxxxxxxx
    const landlineRegex = /^0[2-4][0-9]{7}$/; // Landline: 02xxxxxxx, 03xxxxxxx, 04xxxxxxx
    
    return phoneRegex.test(phone) || landlineRegex.test(phone);
  }

  calculateVolumetricWeight(length: number, width: number, height: number): number {
    return (length * width * height * 0.0002);
  }

  getBillableWeight(actualWeight: number, length: number, width: number, height: number): number {
    const volumetricWeight = this.calculateVolumetricWeight(length, width, height);
    return Math.max(actualWeight, volumetricWeight);
  }
}

export const yalidineAPI = new YalidineAPI(); 