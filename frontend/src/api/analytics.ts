import api from "./http";
import type {
  AnalyticsSummary,
  DealerRiskProfile,
  WarehouseAnalytics,
} from "../types/analytics";

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/analytics/summary");
  return data;
}

export async function getTopDealers(
  limit: number = 10,
): Promise<DealerRiskProfile[]> {
  const { data } = await api.get<DealerRiskProfile[]>(
    `/analytics/dealers/risk?limit=${limit}`,
  );
  return data;
}

export async function getWarehouseAnalytics(): Promise<WarehouseAnalytics[]> {
  const { data } = await api.get<WarehouseAnalytics[]>("/analytics/warehouses");
  return data;
}
