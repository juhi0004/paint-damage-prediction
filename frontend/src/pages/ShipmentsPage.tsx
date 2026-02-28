import { useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getShipments, createShipment } from "../api/shipments";
import type { ShipmentCreate, VehicleType, Warehouse } from "../types/shipment";
import LoadingSpinner from "../components/LoadingSpinner";
import { exportToCSV } from "../utils/export";
import { isDateInRange } from "../utils/dateUtils";
import type { AxiosError } from "axios";

const warehouses: Warehouse[] = ["NAG", "MUM", "GOA", "KOL", "PUN"];
const vehicles: VehicleType[] = ["Autorickshaw", "Vikram", "Minitruck"];
const ITEMS_PER_PAGE = 10;

function ShipmentsPage() {
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

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipments,
  });

  const createMutation = useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Shipment created successfully!");
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
    onError: (error: AxiosError<{ detail?: string }>) => {
      toast.error(error.response?.data?.detail || "Failed to create shipment");
    },
  });

  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    return shipments.filter((shipment) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          shipment.dealer_code.toString().includes(query) ||
          shipment.warehouse.toLowerCase().includes(query) ||
          shipment.vehicle.toLowerCase().includes(query) ||
          shipment.product_code.includes(query);
        if (!matchesSearch) return false;
      }

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (!isDateInRange(shipment.date, start, end)) return false;
      }

      if (warehouseFilter !== "all" && shipment.warehouse !== warehouseFilter) {
        return false;
      }

      if (vehicleFilter !== "all" && shipment.vehicle !== vehicleFilter) {
        return false;
      }

      return true;
    });
  }, [
    shipments,
    searchQuery,
    startDate,
    endDate,
    warehouseFilter,
    vehicleFilter,
  ]);

  const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE);
  const paginatedShipments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShipments, currentPage]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!filteredShipments.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredShipments.map((s) => ({
      Date: format(new Date(s.date), "yyyy-MM-dd HH:mm"),
      Dealer: s.dealer_code,
      Warehouse: s.warehouse,
      "Product Code": s.product_code,
      Vehicle: s.vehicle,
      Shipped: s.shipped,
      Returned: s.returned ?? "",
      "Damage Rate": s.damage_rate
        ? (s.damage_rate * 100).toFixed(2) + "%"
        : "",
      "Loss Value": s.loss_value ?? "",
    }));

    exportToCSV(
      exportData,
      `shipments_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("Shipments exported successfully!");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setWarehouseFilter("all");
    setVehicleFilter("all");
    setCurrentPage(1);
  };

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

    if (form.product_code.length !== 9 || !/^\d+$/.test(form.product_code)) {
      toast.error("Product code must be exactly 9 digits");
      return;
    }

    createMutation.mutate(form);
  };

  if (isLoading) return <LoadingSpinner />;

  const hasActiveFilters =
    searchQuery ||
    startDate ||
    endDate ||
    warehouseFilter !== "all" ||
    vehicleFilter !== "all";

  return (
    <div style={{ padding: "1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                color: "#1e293b",
                marginBottom: "0.25rem",
                fontWeight: 600,
              }}
            >
              Shipments
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              {filteredShipments.length} of {shipments?.length || 0} shipments
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleExportCSV}
              disabled={!filteredShipments.length}
              style={{
                background: filteredShipments.length ? "#10b981" : "#cbd5e1",
                color: "white",
                border: "none",
                padding: "0.625rem 1rem",
                borderRadius: "0.375rem",
                cursor: filteredShipments.length ? "pointer" : "not-allowed",
                fontWeight: 600,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: showForm ? "#64748b" : "#38bdf8",
                color: "white",
                border: "none",
                padding: "0.625rem 1rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {showForm ? "✕ Cancel" : "+ Create Shipment"}
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.125rem",
              color: "#1e293b",
              fontWeight: 600,
            }}
          >
            Create New Shipment
          </h2>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  color: "#475569",
                }}
              >
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="date"
                value={form.date.slice(0, 16)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  background: "white",
                  color: "#1e293b",
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
                  color: "#475569",
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
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  background: "white",
                  color: "#1e293b",
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
                  color: "#475569",
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
                  background: "white",
                  color: "#1e293b",
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
                  color: "#475569",
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
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  background: "white",
                  color: "#1e293b",
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
                  color: "#475569",
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
                  background: "white",
                  color: "#1e293b",
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
                  color: "#475569",
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
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  background: "white",
                  color: "#1e293b",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                disabled={createMutation.isPending}
                style={{
                  background: createMutation.isPending ? "#94a3b8" : "#10b981",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 2rem",
                  borderRadius: "0.375rem",
                  cursor: createMutation.isPending ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                {createMutation.isPending ? "Creating..." : "✓ Create Shipment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            color: "#1e293b",
            fontWeight: 600,
          }}
        >
          Filters
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "#475569",
              }}
            >
              Search
            </label>
            <input
              type="text"
              placeholder="Dealer, warehouse, vehicle..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: "100%",
                padding: "0.625rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                background: "white",
                color: "#1e293b",
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
                color: "#475569",
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: "100%",
                padding: "0.625rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                background: "white",
                color: "#1e293b",
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
                color: "#475569",
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: "100%",
                padding: "0.625rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                background: "white",
                color: "#1e293b",
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
                color: "#475569",
              }}
            >
              Warehouse
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: "100%",
                padding: "0.625rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                background: "white",
                color: "#1e293b",
              }}
            >
              <option value="all">All Warehouses</option>
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
                color: "#475569",
              }}
            >
              Vehicle
            </label>
            <select
              value={vehicleFilter}
              onChange={(e) => {
                setVehicleFilter(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: "100%",
                padding: "0.625rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                background: "white",
                color: "#1e293b",
              }}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: "0.625rem 1rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {paginatedShipments.length > 0 ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "600px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Dealer
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Warehouse
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Vehicle
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Shipped
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Returned
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      Damage Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShipments.map((shipment) => (
                    <tr
                      key={shipment._id}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#1e293b",
                        }}
                      >
                        {format(new Date(shipment.date), "MMM dd, yyyy")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#1e293b",
                        }}
                      >
                        {shipment.dealer_code}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        <span
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {shipment.warehouse}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#1e293b",
                        }}
                      >
                        {shipment.vehicle}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontSize: "0.875rem",
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {shipment.shipped}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontSize: "0.875rem",
                          color: "#64748b",
                        }}
                      >
                        {shipment.returned ?? "-"}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: shipment.damage_rate
                            ? shipment.damage_rate > 0.1
                              ? "#dc2626"
                              : shipment.damage_rate > 0.05
                                ? "#ea580c"
                                : "#16a34a"
                            : "#64748b",
                        }}
                      >
                        {shipment.damage_rate
                          ? `${(shipment.damage_rate * 100).toFixed(2)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  borderTop: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <p
                  style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}
                >
                  Page {currentPage} of {totalPages} •{" "}
                  {filteredShipments.length} results
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "0.5rem 1rem",
                      background: currentPage === 1 ? "#e2e8f0" : "#38bdf8",
                      color: currentPage === 1 ? "#94a3b8" : "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "0.5rem 1rem",
                      background:
                        currentPage === totalPages ? "#e2e8f0" : "#38bdf8",
                      color: currentPage === totalPages ? "#94a3b8" : "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <svg
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 1rem",
                color: "#cbd5e1",
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p
              style={{
                color: "#64748b",
                fontSize: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              {hasActiveFilters
                ? "No shipments match your filters"
                : "No shipments found"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                style={{
                  marginTop: "1rem",
                  background: "#38bdf8",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  marginTop: "1rem",
                  background: "#38bdf8",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Create Your First Shipment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShipmentsPage;
