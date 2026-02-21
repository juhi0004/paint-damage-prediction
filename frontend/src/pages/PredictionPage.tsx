import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPrediction } from "../api/predictions";
import type {
  PredictionRequest,
  PredictionResponse,
  VehicleType,
  Warehouse,
} from "../types/prediction";

const defaultPayload: PredictionRequest = {
  date: new Date().toISOString(),
  dealer_code: 17,
  warehouse: "NAG",
  product_code: "321123678",
  vehicle: "Minitruck",
  shipped: 25,
  model: "xgboost",
};

const warehouses: Warehouse[] = ["NAG", "MUM", "GOA", "KOL", "PUN"];
const vehicles: VehicleType[] = ["Autorickshaw", "Vikram", "Minitruck"];

const PredictionPage: React.FC = () => {
  const [form, setForm] = useState<PredictionRequest>(defaultPayload);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const mutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: (data) => setResult(data),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "dealer_code" || name === "shipped" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>Paint Damage Prediction</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Date:
          <input
            type="datetime-local"
            name="date"
            value={form.date.slice(0, 16)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                date: new Date(e.target.value).toISOString(),
              }))
            }
          />
        </label>

        <label>
          Dealer Code:
          <input
            type="number"
            name="dealer_code"
            value={form.dealer_code}
            onChange={handleChange}
            min={1}
            max={100}
          />
        </label>

        <label>
          Warehouse:
          <select
            name="warehouse"
            value={form.warehouse}
            onChange={handleChange}
          >
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label>
          Product Code:
          <input
            type="text"
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
          />
        </label>

        <label>
          Vehicle:
          <select name="vehicle" value={form.vehicle} onChange={handleChange}>
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          Shipped (tins):
          <input
            type="number"
            name="shipped"
            value={form.shipped}
            onChange={handleChange}
            min={1}
          />
        </label>

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Predicting..." : "Predict Damage"}
        </button>
      </form>

      {mutation.isError && (
        <p style={{ color: "red", marginTop: 16 }}>
          Error: {(mutation.error as Error).message}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 32 }}>
          <h2>Prediction Result</h2>
          <p>
            Risk: <strong>{result.risk_category}</strong>
          </p>
          <p>
            Predicted damage rate:{" "}
            {(result.predicted_damage_rate * 100).toFixed(2)}%
          </p>
          <p>Predicted returned tins: {result.predicted_returned}</p>
          <p>Estimated loss: ₹{result.estimated_loss.toFixed(0)}</p>
          <p>Confidence: {(result.confidence_score * 100).toFixed(1)}%</p>

          <h3>Recommendations</h3>
          <ul>
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>
                <strong>
                  [{rec.priority}] {rec.category}:
                </strong>{" "}
                {rec.message} – {rec.impact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PredictionPage;
