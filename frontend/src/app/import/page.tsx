"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
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
    <AppLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Importar desde banco</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sube tu archivo CSV con columnas: Fecha, Referencia, Descripción, Monto
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : file
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {file ? (
            <div>
              <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m9-9a1 1 0 01.707.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414l3-3A1 1 0 0115 7z" />
              </svg>
              <p className="font-medium text-gray-700">Arrastra tu CSV aquí</p>
              <p className="text-sm text-gray-500 mt-1">o</p>
              <label className="inline-block mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer">
                Seleccionar archivo
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {file && !result && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? "Procesando..." : "Importar transacciones"}
          </button>
        )}

        {result && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Resultado de importación</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{result.imported}</p>
                <p className="text-xs text-gray-500">Importadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{result.categorized}</p>
                <p className="text-xs text-gray-500">Categorizadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{result.uncategorized}</p>
                <p className="text-xs text-gray-500">Sin categoría</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 mb-1">Errores:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...y {result.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
