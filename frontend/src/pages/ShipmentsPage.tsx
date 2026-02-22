import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipments, createShipment } from "../api/shipments";
import type { ShipmentCreate, VehicleType, Warehouse } from "../types/shipment";
import LoadingSpinner from "../components/LoadingSpinner";
import { format } from "date-fns";

const warehouses: Warehouse[] = ["NAG", "MUM", "GOA", "KOL", "PUN"];
const vehicles: VehicleType[] = ["Autorickshaw", "Vikram", "Minitruck"];

const ShipmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ShipmentCreate>({
    date: new Date().toISOString(),
    dealer_code: 1,
    warehouse: "NAG",
    product_code: "123456789",
    vehicle: "Minitruck",
    shipped: 10,
  });

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipments,
  });

  const createMutation = useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setShowForm(false);
      setForm({
        date: new Date().toISOString(),
        dealer_code: 1,
        warehouse: "NAG",
        product_code: "123456789",
        vehicle: "Minitruck",
        shipped: 10,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", color: "#1e293b" }}>Shipments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: "#38bdf8",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.25rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showForm ? "Cancel" : "+ Create Shipment"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1.5rem" }}>Create New Shipment</h2>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Date
              </label>
              <input
                type="datetime-local"
                value={form.date.slice(0, 16)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Dealer Code
              </label>
              <input
                type="number"
                value={form.dealer_code}
                onChange={(e) =>
                  setForm({ ...form, dealer_code: Number(e.target.value) })
                }
                min={1}
                max={100}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Warehouse
              </label>
              <select
                value={form.warehouse}
                onChange={(e) =>
                  setForm({ ...form, warehouse: e.target.value as Warehouse })
                }
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
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
                }}
              >
                Product Code
              </label>
              <input
                type="text"
                value={form.product_code}
                onChange={(e) =>
                  setForm({ ...form, product_code: e.target.value })
                }
                maxLength={9}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Vehicle
              </label>
              <select
                value={form.vehicle}
                onChange={(e) =>
                  setForm({ ...form, vehicle: e.target.value as VehicleType })
                }
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
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
                }}
              >
                Shipped (tins)
              </label>
              <input
                type="number"
                value={form.shipped}
                onChange={(e) =>
                  setForm({ ...form, shipped: Number(e.target.value) })
                }
                min={1}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                disabled={createMutation.isPending}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 2rem",
                  borderRadius: "0.25rem",
                  cursor: createMutation.isPending ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {createMutation.isPending ? "Creating..." : "Create Shipment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shipments Table */}
      <div
        style={{
          background: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              <th
                style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}
              >
                Date
              </th>
              <th
                style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}
              >
                Dealer
              </th>
              <th
                style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}
              >
                Warehouse
              </th>
              <th
                style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}
              >
                Vehicle
              </th>
              <th
                style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}
              >
                Shipped
              </th>
              <th
                style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}
              >
                Returned
              </th>
              <th
                style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}
              >
                Damage Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {shipments?.map((shipment) => (
              <tr
                key={shipment._id}
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <td style={{ padding: "1rem" }}>
                  {format(new Date(shipment.date), "MMM dd, yyyy")}
                </td>
                <td style={{ padding: "1rem" }}>{shipment.dealer_code}</td>
                <td style={{ padding: "1rem" }}>{shipment.warehouse}</td>
                <td style={{ padding: "1rem" }}>{shipment.vehicle}</td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  {shipment.shipped}
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  {shipment.returned ?? "-"}
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  {shipment.damage_rate
                    ? `${(shipment.damage_rate * 100).toFixed(2)}%`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {shipments?.length === 0 && (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}
          >
            No shipments found. Create your first shipment!
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentsPage;
