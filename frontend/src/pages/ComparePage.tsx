import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getTopDealers, getWarehouseAnalytics } from "../api/analytics";

type ComparisonType = "dealers" | "warehouses";

function ComparePage() {
  const [comparisonType, setComparisonType] =
    useState<ComparisonType>("dealers");
  const [selectedDealers, setSelectedDealers] = useState<number[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

  const { data: dealers } = useQuery({
    queryKey: ["top-dealers-all"],
    queryFn: () => getTopDealers(50),
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouse-analytics"],
    queryFn: getWarehouseAnalytics,
  });

  const handleDealerToggle = (dealerCode: number) => {
    setSelectedDealers((prev) =>
      prev.includes(dealerCode)
        ? prev.filter((d) => d !== dealerCode)
        : prev.length < 5
          ? [...prev, dealerCode]
          : prev,
    );
  };

  const handleWarehouseToggle = (warehouse: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouse)
        ? prev.filter((w) => w !== warehouse)
        : prev.length < 5
          ? [...prev, warehouse]
          : prev,
    );
  };

  const dealerComparisonData =
    dealers
      ?.filter((d) => selectedDealers.includes(d.dealer_code))
      .map((d) => ({
        name: `Dealer ${d.dealer_code}`,
        damageRate: Number((d.average_damage_rate * 100).toFixed(2)),
        totalLoss: d.total_loss,
        shipments: d.total_shipments,
      })) ?? [];

  const warehouseComparisonData =
    warehouses
      ?.filter((w) => selectedWarehouses.includes(w.warehouse))
      .map((w) => ({
        name: w.warehouse,
        damageRate: Number((w.average_damage_rate * 100).toFixed(2)),
        shipments: w.total_shipments,
      })) ?? [];

  const COLORS = ["#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>
        Performance Comparison
      </h1>

      {/* Toggle */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => {
            setComparisonType("dealers");
            setSelectedWarehouses([]);
          }}
        >
          Compare Dealers
        </button>

        <button
          onClick={() => {
            setComparisonType("warehouses");
            setSelectedDealers([]);
          }}
        >
          Compare Warehouses
        </button>
      </div>

      {/* Dealer Selection */}
      {comparisonType === "dealers" && (
        <div style={{ marginBottom: "2rem" }}>
          <p>Select up to 5 dealers:</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {dealers?.slice(0, 20).map((dealer, index) => (
              <button
                key={dealer.dealer_code}
                onClick={() => handleDealerToggle(dealer.dealer_code)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedDealers.includes(dealer.dealer_code)
                    ? COLORS[index % COLORS.length]
                    : "#e5e7eb",
                  color: selectedDealers.includes(dealer.dealer_code)
                    ? "white"
                    : "black",
                }}
              >
                Dealer {dealer.dealer_code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warehouse Selection */}
      {comparisonType === "warehouses" && (
        <div style={{ marginBottom: "2rem" }}>
          <p>Select up to 5 warehouses:</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {warehouses?.map((warehouse, index) => (
              <button
                key={warehouse.warehouse}
                onClick={() => handleWarehouseToggle(warehouse.warehouse)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedWarehouses.includes(warehouse.warehouse)
                    ? COLORS[index % COLORS.length]
                    : "#e5e7eb",
                  color: selectedWarehouses.includes(warehouse.warehouse)
                    ? "white"
                    : "black",
                }}
              >
                {warehouse.warehouse}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dealer Charts */}
      {comparisonType === "dealers" && selectedDealers.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="damageRate" fill="#ef4444" name="Damage Rate (%)" />
            </BarChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLoss" fill="#38bdf8" name="Total Loss (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Warehouse Chart */}
      {comparisonType === "warehouses" && selectedWarehouses.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={warehouseComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="damageRate"
              fill="#ef4444"
              name="Damage Rate (%)"
            />
            <Bar
              yAxisId="right"
              dataKey="shipments"
              fill="#38bdf8"
              name="Shipments"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ComparePage;
