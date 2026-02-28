import { useState } from "react";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import Papa from "papaparse";

import { createPrediction } from "../api/predictions";
import type {
  PredictionRequest,
  PredictionResponse,
} from "../types/prediction";

import { exportToCSV } from "../utils/export";

interface CSVRow {
  date?: string;
  dealer_code: string;
  warehouse: string;
  product_code: string;
  vehicle: string;
  shipped: string;
}

interface BatchResult {
  row: number;
  input: PredictionRequest;
  result?: PredictionResponse;
  error?: string;
}

function BatchPrediction() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (selectedFile.type !== "text/csv") {
        toast.error("Please upload a CSV file");
        return;
      }

      setFile(selectedFile);
      setResults([]);
      setProgress(0);
    }
  };

  const processBatch = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResult) => {
        const data = parseResult.data;
        const totalRows = data.length;

        if (totalRows === 0) {
          toast.error("CSV file is empty");
          setIsProcessing(false);
          return;
        }

        toast.success(`Processing ${totalRows} shipments...`);

        const batchResults: BatchResult[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];

          try {
            const request: PredictionRequest = {
              date: row.date ?? new Date().toISOString(),
              dealer_code: Number(row.dealer_code),
              warehouse: row.warehouse as PredictionRequest["warehouse"],
              product_code: row.product_code,
              vehicle: row.vehicle as PredictionRequest["vehicle"],
              shipped: Number(row.shipped),
              model: "xgboost",
            };

            const result = await createPrediction(request);

            batchResults.push({
              row: i + 1,
              input: request,
              result,
            });
          } catch (error: unknown) {
            let errorMessage = "Prediction failed";

            if (
              typeof error === "object" &&
              error !== null &&
              "response" in error
            ) {
              const err = error as {
                response?: { data?: { detail?: string } };
              };

              errorMessage = err.response?.data?.detail ?? errorMessage;
            }

            const request: PredictionRequest = {
              date: row.date ?? new Date().toISOString(),
              dealer_code: Number(row.dealer_code),
              warehouse: row.warehouse as PredictionRequest["warehouse"],
              product_code: row.product_code,
              vehicle: row.vehicle as PredictionRequest["vehicle"],
              shipped: Number(row.shipped),
              model: "xgboost",
            };

            batchResults.push({
              row: i + 1,
              input: request,
              error: errorMessage,
            });
          }

          setProgress(((i + 1) / totalRows) * 100);
          setResults([...batchResults]);
        }

        setIsProcessing(false);
        toast.success(`Completed! Processed ${totalRows} shipments`);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
        setIsProcessing(false);
      },
    });
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    const exportData = results.map((r) => ({
      Row: r.row,
      Date: r.input.date,
      Dealer: r.input.dealer_code,
      Warehouse: r.input.warehouse,
      Vehicle: r.input.vehicle,
      Shipped: r.input.shipped,
      "Risk Level": r.result?.risk_category ?? "Error",
      "Damage Rate": r.result
        ? `${(r.result.predicted_damage_rate * 100).toFixed(2)}%`
        : "-",
      "Predicted Returns": r.result?.predicted_returned ?? "-",
      "Estimated Loss": r.result ? r.result.estimated_loss.toFixed(0) : "-",
      Error: r.error ?? "",
    }));

    exportToCSV(
      exportData,
      `batch_predictions_${new Date().toISOString().split("T")[0]}.csv`,
    );

    toast.success("Results exported successfully!");
  };

  const downloadTemplate = () => {
    const template = [
      {
        date: "2026-02-28T10:00:00Z",
        dealer_code: 17,
        warehouse: "NAG",
        product_code: "321123678",
        vehicle: "Minitruck",
        shipped: 25,
      },
      {
        date: "2026-02-28T11:00:00Z",
        dealer_code: 23,
        warehouse: "MUM",
        product_code: "456789123",
        vehicle: "Autorickshaw",
        shipped: 30,
      },
    ];

    exportToCSV(template, "batch_prediction_template.csv");
    toast.success("Template downloaded!");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Batch Prediction Upload</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <div style={{ marginTop: "1rem" }}>
        <button onClick={downloadTemplate}>Download Template</button>

        <button onClick={processBatch} disabled={!file || isProcessing}>
          {isProcessing
            ? `Processing... ${Math.round(progress)}%`
            : "Process Batch"}
        </button>

        {results.length > 0 && (
          <button onClick={handleExportResults}>Export Results</button>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Results ({results.length})</h3>
          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Row</th>
                <th>Dealer</th>
                <th>Warehouse</th>
                <th>Risk</th>
                <th>Damage Rate</th>
                <th>Returns</th>
                <th>Loss</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.row}>
                  <td>{result.row}</td>
                  <td>{result.input.dealer_code}</td>
                  <td>{result.input.warehouse}</td>
                  <td>{result.result?.risk_category ?? "-"}</td>
                  <td>
                    {result.result
                      ? `${(result.result.predicted_damage_rate * 100).toFixed(
                          2,
                        )}%`
                      : "-"}
                  </td>
                  <td>{result.result?.predicted_returned ?? "-"}</td>
                  <td>
                    {result.result
                      ? `₹${result.result.estimated_loss.toFixed(0)}`
                      : "-"}
                  </td>
                  <td>{result.error ? "Error" : "Success"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BatchPrediction;
