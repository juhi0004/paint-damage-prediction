import api from "./http";
import type {
  PredictionRequest,
  PredictionResponse,
} from "../types/prediction";

export async function createPrediction(
  payload: PredictionRequest,
): Promise<PredictionResponse> {
  const { data } = await api.post<PredictionResponse>(
    "/predictions/predict",
    payload,
  );
  return data;
}
