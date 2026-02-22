import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopDealers, getWarehouseAnalytics } from "../api/analytics";
import LoadingSpinner from "../components/LoadingSpinner";

const AnalyticsPage: React.FC = () => {
  const { data: dealers, isLoading: loadingDealers } = useQuery({
    queryKey: ["top-dealers"],
    queryFn: () => getTopDealers(10),
  });

  const { data: warehouses, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouse-analytics"],
    queryFn: getWarehouseAnalytics,
  });

  if (loadingDealers || loadingWarehouses) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#1e293b" }}>
        Analytics
      </h1>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Top Risk Dealers */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
            Top Risk Dealers
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  Dealer
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Damage Rate
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {dealers?.map((dealer) => (
                <tr
                  key={dealer.dealer_code}
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <td style={{ padding: "0.75rem" }}>
                    Dealer {dealer.dealer_code}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    {(dealer.average_damage_rate * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    ₹{dealer.total_loss.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warehouse Performance */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
            Warehouse Performance
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  Warehouse
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Shipments
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Damage Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {warehouses?.map((warehouse) => (
                <tr
                  key={warehouse.warehouse}
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <td style={{ padding: "0.75rem" }}>{warehouse.warehouse}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    {warehouse.total_shipments}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    {(warehouse.average_damage_rate * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
