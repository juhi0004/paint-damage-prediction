import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPrediction } from "../api/predictions";
import type {
  PredictionRequest,
  PredictionResponse,
  VehicleType,
  Warehouse,
} from "../types/prediction";
import toast from "react-hot-toast";

function PredictionPage() {
  const [form, setForm] = useState<Omit<PredictionRequest, "model">>({
    date: new Date().toISOString().slice(0, 16),
    dealer_code: 17,
    warehouse: "NAG",
    product_code: "321123678",
    vehicle: "Minitruck",
    shipped: 25,
  });

  const [result, setResult] = useState<PredictionResponse | null>(null);

  const mutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: (data) => {
      setResult(data);
      toast.success("Prediction generated successfully!");
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Prediction failed");
      }

      console.error("Prediction error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (form.dealer_code < 1 || form.dealer_code > 100) {
      toast.error("Dealer code must be between 1 and 100");
      return;
    }

    if (form.product_code.length !== 9) {
      toast.error("Product code must be exactly 9 digits");
      return;
    }

    if (form.shipped <= 0) {
      toast.error("Shipped quantity must be greater than 0");
      return;
    }

    const requestData: PredictionRequest = {
      ...form,
      date: new Date(form.date).toISOString(),
      model: "xgboost",
    };

    mutation.mutate(requestData);
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case "Low":
        return { bg: "#ecfdf5", border: "#10b981", text: "#065f46" };
      case "Medium":
        return { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
      case "High":
        return { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" };
      case "Critical":
        return { bg: "#fecaca", border: "#dc2626", text: "#7f1d1d" };
      default:
        return { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" };
      case "HIGH":
        return { bg: "#fed7aa", border: "#ea580c", text: "#9a3412" };
      case "MEDIUM":
        return { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
      case "LOW":
        return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };
      default:
        return { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" };
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
            fontWeight: 600,
          }}
        >
          Paint Damage Prediction
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Predict damage rates and get actionable recommendations for your
          shipment
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "2rem",
        }}
      >
        {/* Form Section */}
        <div
          style={{
            background: "var(--bg-secondary)",
            padding: "2rem",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border-color-light)",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "1.5rem",
              color: "var(--text-primary)",
              fontWeight: 600,
            }}
          >
            Shipment Details
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {/* Date & Time */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Dealer Code */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Dealer Code (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.dealer_code}
                  onChange={(e) =>
                    setForm({ ...form, dealer_code: parseInt(e.target.value) })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Warehouse */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Warehouse
                </label>
                <select
                  value={form.warehouse}
                  onChange={(e) =>
                    setForm({ ...form, warehouse: e.target.value as Warehouse })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="NAG">NAG - Nagpur</option>
                  <option value="MUM">MUM - Mumbai</option>
                  <option value="GOA">GOA - Goa</option>
                  <option value="KOL">KOL - Kolkata</option>
                  <option value="PUN">PUN - Pune</option>
                </select>
              </div>

              {/* Product Code */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Product Code (9 digits)
                </label>
                <input
                  type="text"
                  pattern="[0-9]{9}"
                  maxLength={9}
                  value={form.product_code}
                  onChange={(e) =>
                    setForm({ ...form, product_code: e.target.value })
                  }
                  placeholder="321123678"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Vehicle Type
                </label>
                <select
                  value={form.vehicle}
                  onChange={(e) =>
                    setForm({ ...form, vehicle: e.target.value as VehicleType })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="Minitruck">Minitruck (Capacity: 30)</option>
                  <option value="Vikram">Vikram (Capacity: 20)</option>
                  <option value="Autorickshaw">
                    Autorickshaw (Capacity: 15)
                  </option>
                </select>
              </div>

              {/* Shipped Quantity */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Shipped Quantity (tins)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.shipped}
                  onChange={(e) =>
                    setForm({ ...form, shipped: parseInt(e.target.value) })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutation.isPending}
                style={{
                  padding: "0.875rem",
                  background: mutation.isPending ? "#94a3b8" : "#38bdf8",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: mutation.isPending ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginTop: "0.5rem",
                }}
              >
                {mutation.isPending ? "Generating..." : "Generate Prediction"}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Risk Level Card */}
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "2rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px var(--shadow)",
                border: "1px solid var(--border-color-light)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "2rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    Risk Level
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "0.5rem",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      ...getRiskColor(result.risk_category),
                      border: `3px solid ${getRiskColor(result.risk_category).border}`,
                      background: getRiskColor(result.risk_category).bg,
                      color: getRiskColor(result.risk_category).text,
                    }}
                  >
                    {result.risk_category}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {" "}
                    {/*Confidence score removed for now 
                    Confidence */}
                  </p>
                  {/*
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {(result.confidence_score * 100).toFixed(1)}%
                  </p> */}
                </div>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Damage Rate
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color:
                        result.predicted_damage_rate > 0.1
                          ? "#dc2626"
                          : result.predicted_damage_rate > 0.05
                            ? "#ea580c"
                            : "#16a34a",
                      margin: 0,
                    }}
                  >
                    {(result.predicted_damage_rate * 100).toFixed(2)}%
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-tertiary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    of {form.shipped} tins
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Predicted Returns
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {result.predicted_returned}
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-tertiary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    damaged tins
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Estimated Loss
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: "#dc2626",
                      margin: 0,
                    }}
                  >
                    ₹{result.estimated_loss.toLocaleString("en-IN")}
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-tertiary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    @ ₹500/tin
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Loading Ratio
                  </p>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "bold",
                      color: result.is_overloaded ? "#dc2626" : "#16a34a",
                      margin: 0,
                    }}
                  >
                    {((result.loading_ratio || 0) * 100).toFixed(0)}%
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-tertiary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {result.is_overloaded ? "Overloaded" : "Safe"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "2rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px var(--shadow)",
                border: "1px solid var(--border-color-light)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1.5rem",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                }}
              >
                Recommendations
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {result.recommendations.map((rec, idx) => {
                  const colors = getPriorityColor(rec.priority);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "1.25rem",
                        borderLeft: `4px solid ${colors.border}`,
                        background: colors.bg,
                        borderRadius: "0.375rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "0.5rem",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.25rem",
                            background: colors.border,
                            color: "white",
                            textTransform: "uppercase",
                          }}
                        >
                          {rec.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: colors.text,
                            textTransform: "uppercase",
                          }}
                        >
                          {rec.category}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          color: colors.text,
                          margin: "0.75rem 0",
                          lineHeight: 1.5,
                          fontWeight: 500,
                        }}
                      >
                        {rec.message}
                      </p>
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: colors.text,
                          fontStyle: "italic",
                          margin: 0,
                        }}
                      >
                        Impact: {rec.impact}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historical Context */}
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "2rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px var(--shadow)",
                border: "1px solid var(--border-color-light)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1.5rem",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                }}
              >
                Historical Context
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--bg-primary)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Dealer Historical Risk
                  </p>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color:
                        result.dealer_historical_risk === "Critical"
                          ? "#dc2626"
                          : result.dealer_historical_risk === "High"
                            ? "#ea580c"
                            : result.dealer_historical_risk === "Medium"
                              ? "#f59e0b"
                              : "#16a34a",
                      margin: 0,
                    }}
                  >
                    {result.dealer_historical_risk}
                  </p>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--bg-primary)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Warehouse Historical Risk
                  </p>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color:
                        result.warehouse_historical_risk === "Critical"
                          ? "#dc2626"
                          : result.warehouse_historical_risk === "High"
                            ? "#ea580c"
                            : result.warehouse_historical_risk === "Medium"
                              ? "#f59e0b"
                              : "#16a34a",
                      margin: 0,
                    }}
                  >
                    {result.warehouse_historical_risk}
                  </p>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--bg-primary)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color-light)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Model Version
                  </p>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {result.model_version}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictionPage;
