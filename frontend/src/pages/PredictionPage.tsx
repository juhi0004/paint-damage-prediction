import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
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

function PredictionPage() {
  const [form, setForm] = useState<PredictionRequest>(defaultPayload);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const mutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: (data) => {
      setResult(data);
      toast.success("Prediction generated successfully!");
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      toast.error(error.response?.data?.detail ?? "Prediction failed");
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "dealer_code" || name === "shipped" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (form.dealer_code < 1 || form.dealer_code > 100) {
      toast.error("Dealer code must be between 1 and 100");
      return;
    }
    if (form.product_code.length !== 9 || !/^\d+$/.test(form.product_code)) {
      toast.error("Product code must be exactly 9 digits");
      return;
    }
    if (form.shipped < 1) {
      toast.error("Shipped quantity must be at least 1");
      return;
    }

    mutation.mutate(form);
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case "Low":
        return "#10b981";
      case "Medium":
        return "#f59e0b";
      case "High":
        return "#f97316";
      case "Critical":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
        return "#f97316";
      case "CRITICAL":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#1e293b" }}>
        Paint Damage Prediction
      </h1>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Form Section */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            height: "fit-content",
          }}
        >
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.25rem",
              color: "#1e293b",
            }}
          >
            Shipment Details
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Date & Time
              </label>
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
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Dealer Code (1-100)
              </label>
              <input
                type="number"
                name="dealer_code"
                value={form.dealer_code}
                onChange={handleChange}
                min={1}
                max={100}
                required
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Warehouse
              </label>
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              >
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Product Code (9 digits)
              </label>
              <input
                type="text"
                name="product_code"
                value={form.product_code}
                onChange={handleChange}
                maxLength={9}
                pattern="\d{9}"
                required
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Vehicle Type
              </label>
              <select
                name="vehicle"
                value={form.vehicle}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              >
                {vehicles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Shipped Quantity (tins)
              </label>
              <input
                type="number"
                name="shipped"
                value={form.shipped}
                onChange={handleChange}
                min={1}
                required
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: mutation.isPending ? "#94a3b8" : "#38bdf8",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: mutation.isPending ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {mutation.isPending ? "Analyzing..." : "Generate Prediction"}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div>
          {result && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Risk Overview Card */}
              <div
                style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  borderLeft: `6px solid ${getRiskColor(result.risk_category)}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Risk Level
                    </p>
                    <h2
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: "bold",
                        color: getRiskColor(result.risk_category),
                        margin: 0,
                      }}
                    >
                      {result.risk_category}
                    </h2>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Confidence
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#1e293b",
                      }}
                    >
                      {(result.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Damage Rate
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {(result.predicted_damage_rate * 100).toFixed(2)}%
                  </p>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Predicted Returns
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {result.predicted_returned} tins
                  </p>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Estimated Loss
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: "#ef4444",
                    }}
                  >
                    ₹{result.estimated_loss.toFixed(0)}
                  </p>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Loading Ratio
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: result.is_overloaded ? "#ef4444" : "#10b981",
                    }}
                  >
                    {((result.loading_ratio || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    marginBottom: "1rem",
                    color: "#1e293b",
                  }}
                >
                  Recommendations
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1rem",
                        background: "#f8fafc",
                        borderRadius: "0.375rem",
                        borderLeft: `4px solid ${getPriorityColor(rec.priority)}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: getPriorityColor(rec.priority),
                            textTransform: "uppercase",
                          }}
                        >
                          {rec.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#64748b",
                            background: "white",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {rec.category}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#1e293b",
                          marginBottom: "0.5rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {rec.message}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontStyle: "italic",
                        }}
                      >
                        Impact: {rec.impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    marginBottom: "1rem",
                    color: "#1e293b",
                  }}
                >
                  Historical Context
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Dealer Risk Level
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {result.dealer_historical_risk || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Warehouse Performance
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {result.warehouse_historical_risk || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!result && (
            <div
              style={{
                background: "white",
                padding: "4rem 2rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <svg
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 1rem",
                  opacity: 0.3,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p style={{ color: "#64748b", fontSize: "1rem" }}>
                Enter shipment details and click "Generate Prediction" to see
                results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictionPage;
