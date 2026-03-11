import type {
  PredictionRequest,
  PredictionResponse,
} from "../types/prediction";
//import { http } from "./http";
import http from "./http";

export async function createPrediction(
  data: PredictionRequest,
): Promise<PredictionResponse> {
  const response = await http.post<PredictionResponse>("/predictions", data);
  return response.data;
}

export async function getPredictionHealth() {
  const response = await http.get("/predictions/health");
  return response.data;
}

export async function getModelInfo() {
  const response = await http.get("/predictions/model-info");
  return response.data;
}
