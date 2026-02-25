import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getTopDealers,
  getWarehouseAnalytics,
  getAnalyticsSummary,
} from "../api/analytics";
import LoadingSpinner from "../components/LoadingSpinner";

const COLORS = [
  "#38bdf8",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function AnalyticsPage() {
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  const { data: dealers, isLoading: loadingDealers } = useQuery({
    queryKey: ["top-dealers"],
    queryFn: () => getTopDealers(10),
  });

  const { data: warehouses, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouse-analytics"],
    queryFn: getWarehouseAnalytics,
  });

  if (loadingDealers || loadingWarehouses) return <LoadingSpinner />;

  // Prepare chart data
  const dealerChartData =
    dealers?.slice(0, 10).map((d) => ({
      name: `Dealer ${d.dealer_code}`,
      damageRate: (d.average_damage_rate * 100).toFixed(2),
      loss: d.total_loss,
    })) || [];

  const warehouseChartData =
    warehouses?.map((w) => ({
      name: w.warehouse,
      shipments: w.total_shipments,
      damageRate: (w.average_damage_rate * 100).toFixed(2),
    })) || [];

  const riskDistribution = summary
    ? [
        {
          name: "Low Risk",
          value:
            summary.total_shipments -
            summary.high_risk_shipments -
            summary.critical_risk_shipments,
        },
        { name: "High Risk", value: summary.high_risk_shipments },
        { name: "Critical Risk", value: summary.critical_risk_shipments },
      ]
    : [];

  return (
    <div>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#1e293b" }}>
        Analytics Dashboard
      </h1>

      {/* Charts Grid */}
      <div style={{ display: "grid", gap: "2rem" }}>
        {/* Top Dealers - Bar Chart */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
            Top 10 High-Risk Dealers
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="damageRate" fill="#ef4444" name="Damage Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Warehouse Performance - Line + Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
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
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
              Warehouse Shipments
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={warehouseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="shipments"
                  fill="#38bdf8"
                  name="Total Shipments"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
              Warehouse Damage Rates
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warehouseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="damageRate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Damage Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution - Pie Chart */}
        {summary && (
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
              Risk Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data Tables */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
        >
          {/* Top Risk Dealers Table */}
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
                      fontSize: "0.875rem",
                    }}
                  >
                    Dealer
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Damage Rate
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.875rem",
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
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      Dealer {dealer.dealer_code}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#ef4444",
                      }}
                    >
                      {(dealer.average_damage_rate * 100).toFixed(2)}%
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        fontSize: "0.875rem",
                      }}
                    >
                      ₹{dealer.total_loss.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warehouse Performance Table */}
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
                      fontSize: "0.875rem",
                    }}
                  >
                    Warehouse
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Shipments
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.875rem",
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
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                      {warehouse.warehouse}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        fontSize: "0.875rem",
                      }}
                    >
                      {warehouse.total_shipments}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color:
                          warehouse.average_damage_rate > 0.1
                            ? "#ef4444"
                            : warehouse.average_damage_rate > 0.05
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    >
                      {(warehouse.average_damage_rate * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
