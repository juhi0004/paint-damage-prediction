export type VehicleType = "Autorickshaw" | "Vikram" | "Minitruck";
export type Warehouse = "NAG" | "MUM" | "GOA" | "KOL" | "PUN";
export type RiskCategory = "Low" | "Medium" | "High" | "Critical";

export interface PredictionRequest {
  date: string; // ISO string
  dealer_code: number;
  warehouse: Warehouse;
  product_code: string;
  vehicle: VehicleType;
  shipped: number;
  model?: "xgboost" | "ensemble";
}

export interface RecommendationItem {
  priority: string;
  category: string;
  message: string;
  impact: string;
}

export interface PredictionResponse {
  prediction_id: string;
  timestamp: string;
  input: PredictionRequest;
  predicted_damage_rate: number;
  predicted_returned: number;
  risk_category: RiskCategory;
  confidence_score: number;
  estimated_loss: number;
  model_name: string;
  feature_importance: Record<string, number>;
  recommendations: RecommendationItem[];
  dealer_historical_risk?: string;
  warehouse_historical_risk?: string;
  is_overloaded: boolean;
  loading_ratio?: number;
}
