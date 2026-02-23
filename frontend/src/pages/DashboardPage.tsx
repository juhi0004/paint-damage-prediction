import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary } from "../api/analytics";
import LoadingSpinner from "../components/LoadingSpinner";

function DashboardPage() {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading dashboard data</div>;
  if (!summary) return null;

  const cards = [
    {
      label: "Total Shipments",
      value: summary.total_shipments,
      color: "#3b82f6",
    },
    {
      label: "Tins Shipped",
      value: summary.total_tins_shipped.toLocaleString(),
      color: "#10b981",
    },
    {
      label: "Tins Returned",
      value: summary.total_tins_returned.toLocaleString(),
      color: "#ef4444",
    },
    {
      label: "Avg Damage Rate",
      value: `${(summary.average_damage_rate * 100).toFixed(2)}%`,
      color: "#f59e0b",
    },
    {
      label: "Total Loss",
      value: `₹${summary.total_estimated_loss.toLocaleString()}`,
      color: "#ef4444",
    },
    {
      label: "High Risk Shipments",
      value: summary.high_risk_shipments,
      color: "#f97316",
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#1e293b" }}>
        Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              {card.label}
            </p>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
