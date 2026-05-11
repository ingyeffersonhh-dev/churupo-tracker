"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthStore, initAuth } from "@/store/auth";
import type { CSVUploadResult } from "@/types";

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CSVUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    } else {
      setError("Solo se permiten archivos CSV");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !session) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Error al subir el archivo");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Importar</h1>
          <p className="page-subtitle">Sube tu archivo CSV con columnas: Fecha, Referencia, Descripción, Monto</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `3px dashed ${dragging ? "var(--accent)" : file ? "var(--accent-green)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            padding: "48px 24px",
            textAlign: "center",
            background: dragging ? "var(--accent-light)" : file ? "rgba(0,204,102,0.05)" : "transparent",
            transition: "all 0.2s",
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p className="font-bold text-lg">{file.name}</p>
              <p className="text-sm text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12 }}
              >
                Eliminar
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <p className="font-bold text-lg">Arrastra tu CSV aquí</p>
              <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>o selecciona un archivo</p>
              <label className="btn btn-primary">
                Seleccionar archivo
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(255,51,51,0.08)",
            border: "1px solid rgba(255,51,51,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            color: "var(--accent-red)",
            marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {file && !result && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {uploading ? "⏳ Procesando..." : "Importar transacciones"}
          </button>
        )}

        {result && (
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Resultado de importación</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "var(--accent)" }}>{result.imported}</p>
                <p className="text-sm text-secondary">Importadas</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-green)" }}>{result.categorized}</p>
                <p className="text-sm text-secondary">Categorizadas</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-yellow)" }}>{result.uncategorized}</p>
                <p className="text-sm text-secondary">Sin categoría</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div style={{ background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
                <p className="text-sm font-bold text-red" style={{ marginBottom: 8 }}>Errores:</p>
                <ul style={{ fontSize: 12, color: "var(--accent-red)" }}>
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...y {result.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
