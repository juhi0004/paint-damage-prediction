export interface AnalyticsSummary {
  total_shipments: number;
  total_tins_shipped: number;
  total_tins_returned: number;
  average_damage_rate: number;
  total_estimated_loss: number;
  high_risk_shipments: number;
  critical_risk_shipments: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

export interface DealerRiskProfile {
  dealer_code: number;
  dealer_name?: string;
  total_shipments: number;
  average_damage_rate: number;
  total_loss: number;
  risk_category: string;
  trend?: string;
}

export interface WarehouseAnalytics {
  warehouse: string;
  total_shipments: number;
  average_damage_rate: number;
  total_loss: number;
  most_common_vehicle?: string;
  overload_frequency?: number;
}
