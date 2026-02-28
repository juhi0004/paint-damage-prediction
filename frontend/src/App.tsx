import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PredictionPage from "./pages/PredictionPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BatchPrediction from "./components/BatchPrediction";
import AlertsPage from "./pages/AlertsPage";
import ComparePage from "./pages/ComparePage";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <DashboardPage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <PredictionPage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/batch-predictions"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <BatchPrediction />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <ShipmentsPage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <AnalyticsPage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <AlertsPage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <PrivateRoute>
              <Layout>
                <ErrorBoundary>
                  <ComparePage />
                </ErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
