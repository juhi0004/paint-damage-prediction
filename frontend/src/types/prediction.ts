export interface PredictionRequest {
  date: string;
  dealer_code: number;
  warehouse: "NAG" | "MUM" | "GOA" | "KOL" | "PUN";
  product_code: string;
  vehicle: "Autorickshaw" | "Vikram" | "Minitruck";
  shipped: number;
  model: string;
}

export interface Recommendation {
  priority: string;
  category: string;
  message: string;
  impact: string;
}

export interface PredictionResponse {
  predicted_damage_rate: number;
  predicted_returned: number;
  estimated_loss: number;
  risk_category: string;
  confidence_score: number;
  loading_ratio: number;
  is_overloaded: boolean;
  recommendations: Recommendation[];
  dealer_historical_risk: string;
  warehouse_historical_risk: string;
  model_version: string;
  prediction_timestamp: string;
}

export type VehicleType = "Autorickshaw" | "Vikram" | "Minitruck";
export type Warehouse = "NAG" | "MUM" | "GOA" | "KOL" | "PUN";
