export type VehicleType = "Autorickshaw" | "Vikram" | "Minitruck";
export type Warehouse = "NAG" | "MUM" | "GOA" | "KOL" | "PUN";

export interface ShipmentBase {
  date: string;
  dealer_code: number;
  warehouse: Warehouse;
  product_code: string;
  vehicle: VehicleType;
  shipped: number;
  returned?: number;
}

export type ShipmentCreate = ShipmentBase;

export interface ShipmentResponse extends ShipmentBase {
  _id: string;
  damage_rate?: number;
  loss_value?: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentUpdate {
  returned: number;
}
