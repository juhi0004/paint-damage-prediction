import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getShipments } from "../api/shipments";
import { getTopDealers } from "../api/analytics";

type AlertType = "critical" | "high" | "warning" | "info";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  dealer?: number;
  warehouse?: string;
}

interface Shipment {
  _id: string;
  dealer_code: number;
  warehouse: string;
  damage_rate?: number;
  date: string;
}

interface Dealer {
  dealer_code: number;
  average_damage_rate: number;
}

function AlertsPage() {
  const { data: shipments } = useQuery<Shipment[]>({
    queryKey: ["shipments"],
    queryFn: getShipments,
  });

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["top-dealers"],
    queryFn: () => getTopDealers(20),
  });

  const alerts: Alert[] = useMemo(() => {
    const newAlerts: Alert[] = [];

    // 🚨 Critical dealers
    if (dealers) {
      dealers.slice(0, 3).forEach((dealer) => {
        if (dealer.average_damage_rate > 0.15) {
          newAlerts.push({
            id: `dealer-critical-${dealer.dealer_code}`,
            type: "critical",
            title: `Critical Risk: Dealer ${dealer.dealer_code}`,
            message: `Damage rate of ${(
              dealer.average_damage_rate * 100
            ).toFixed(1)}% exceeds critical threshold.`,
            timestamp: new Date("2024-01-01T00:00:00Z"), // fixed constant
            actionRequired: true,
            dealer: dealer.dealer_code,
          });
        }
      });
    }

    // 🔥 High damage shipments
    if (shipments) {
      shipments
        .filter((s) => s.damage_rate !== undefined && s.damage_rate > 0.1)
        .slice(0, 5)
        .forEach((shipment, idx) => {
          newAlerts.push({
            id: `shipment-high-${shipment._id}-${idx}`,
            type: "high",
            title: "High Damage Rate Detected",
            message: `Shipment to Dealer ${
              shipment.dealer_code
            } from ${shipment.warehouse} had ${(
              shipment.damage_rate! * 100
            ).toFixed(1)}% damage rate.`,
            timestamp: new Date(shipment.date),
            actionRequired: true,
            dealer: shipment.dealer_code,
            warehouse: shipment.warehouse,
          });
        });
    }

    // ⚠️ Warning dealers
    if (dealers) {
      dealers.slice(3, 7).forEach((dealer) => {
        if (
          dealer.average_damage_rate > 0.08 &&
          dealer.average_damage_rate <= 0.15
        ) {
          newAlerts.push({
            id: `dealer-warning-${dealer.dealer_code}`,
            type: "warning",
            title: `Warning: Dealer ${dealer.dealer_code}`,
            message: `Damage rate of ${(
              dealer.average_damage_rate * 100
            ).toFixed(1)}% is approaching critical levels.`,
            timestamp: new Date("2024-01-01T00:00:00Z"),
            actionRequired: false,
            dealer: dealer.dealer_code,
          });
        }
      });
    }

    // ℹ️ Static system alert
    newAlerts.push({
      id: "system-info",
      type: "info",
      title: "System Update",
      message:
        "Prediction model updated with latest data. Accuracy improved to 94.2%.",
      timestamp: new Date("2024-01-01T00:00:00Z"),
      actionRequired: false,
    });

    return newAlerts.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }, [shipments, dealers]);

  const getAlertStyle = (type: AlertType) => {
    switch (type) {
      case "critical":
        return { background: "#fee2e2", borderLeft: "6px solid #dc2626" };
      case "high":
        return { background: "#fef3c7", borderLeft: "6px solid #f59e0b" };
      case "warning":
        return { background: "#e0f2fe", borderLeft: "6px solid #0284c7" };
      default:
        return { background: "#f3f4f6", borderLeft: "6px solid #6b7280" };
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>
        Alerts & Notifications
      </h1>

      {alerts.length === 0 && <p>No alerts at this time.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              ...getAlertStyle(alert.type),
              padding: "1rem",
              borderRadius: "6px",
            }}
          >
            <h3 style={{ margin: 0 }}>{alert.title}</h3>
            <p style={{ margin: "0.5rem 0" }}>{alert.message}</p>

            <small style={{ color: "#6b7280" }}>
              {alert.timestamp.toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPage;
