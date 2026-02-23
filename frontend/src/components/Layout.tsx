import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/predictions", label: "Predictions" },
    { path: "/shipments", label: "Shipments" },
    { path: "/analytics", label: "Analytics" },
  ];

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* Navbar */}
      <nav
        style={{
          background: "#1e293b",
          color: "white",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            Paint Damage Prediction
          </h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  color: location.pathname === item.path ? "#38bdf8" : "white",
                  textDecoration: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.25rem",
                  background:
                    location.pathname === item.path
                      ? "rgba(56, 189, 248, 0.1)"
                      : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem" }}>
            {user?.full_name} ({user?.role})
          </span>
          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", background: "#f8fafc" }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#1e293b",
          color: "white",
          padding: "1rem 2rem",
          textAlign: "center",
          fontSize: "0.875rem",
        }}
      >
        © 2026 Paint Damage Prediction System
      </footer>
    </div>
  );
}

export default Layout;
