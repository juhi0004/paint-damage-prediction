import type { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkStyle = (active: boolean) => ({
    padding: "0.75rem 1.25rem",
    borderRadius: "0.375rem",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 500,
    transition: "all 0.2s",
    background: active ? "#e0f2fe" : "transparent",
    color: active ? "#0369a1" : "var(--text-secondary)",
  });

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <nav
        style={{
          background: "var(--bg-secondary)",
          boxShadow: "0 1px 3px var(--shadow)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid var(--border-color-light)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link
            to="/dashboard"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#38bdf8" />
              <path d="M16 8L8 14v10h6v-6h4v6h6V14l-8-6z" fill="white" />
            </svg>
            Paint Predictor
          </Link>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link to="/dashboard" style={navLinkStyle(isActive("/dashboard"))}>
              Dashboard
            </Link>
            <Link
              to="/predictions"
              style={navLinkStyle(isActive("/predictions"))}
            >
              Predictions
            </Link>
            <Link
              to="/batch-predictions"
              style={navLinkStyle(isActive("/batch-predictions"))}
            >
              Batch Upload
            </Link>
            <Link to="/shipments" style={navLinkStyle(isActive("/shipments"))}>
              Shipments
            </Link>
            <Link to="/analytics" style={navLinkStyle(isActive("/analytics"))}>
              Analytics
            </Link>
            <Link to="/alerts" style={navLinkStyle(isActive("/alerts"))}>
              Alerts
            </Link>
            <Link to="/compare" style={navLinkStyle(isActive("/compare"))}>
              Compare
            </Link>

            <div
              style={{
                height: "24px",
                width: "1px",
                background: "var(--border-color-light)",
                margin: "0 0.5rem",
              }}
            />

            <ThemeToggle />

            <span
              style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}
            >
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.625rem 1.25rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.5rem",
        }}
      >
        {children}
      </main>

      <footer
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-color-light)",
          padding: "1.5rem",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            © 2026 Paint Damage Predictor. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a
              href="#"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              Privacy
            </a>
            <a
              href="#"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              Terms
            </a>
            <a
              href="#"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
