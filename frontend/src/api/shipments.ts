import api from "./http";
import type {
  ShipmentCreate,
  ShipmentResponse,
  ShipmentUpdate,
} from "../types/shipment";

export async function getShipments(): Promise<ShipmentResponse[]> {
  const { data } = await api.get<ShipmentResponse[]>("/shipments");
  return data;
}

export async function createShipment(
  payload: ShipmentCreate,
): Promise<ShipmentResponse> {
  const { data } = await api.post<ShipmentResponse>("/shipments", payload);
  return data;
}

export async function updateShipment(
  id: string,
  payload: ShipmentUpdate,
): Promise<ShipmentResponse> {
  const { data } = await api.patch<ShipmentResponse>(
    `/shipments/${id}`,
    payload,
  );
  return data;
}

export async function getShipmentById(id: string): Promise<ShipmentResponse> {
  const { data } = await api.get<ShipmentResponse>(`/shipments/${id}`);
  return data;
}
