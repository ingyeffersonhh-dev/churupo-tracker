"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { CpuArchitectureLoading } from "@/components/CpuArchitectureLoading";

interface BackendContextType {
  isBackendReady: boolean;
  isChecking: boolean;
}

const BackendContext = createContext<BackendContextType>({
  isBackendReady: true,
  isChecking: false,
});

export function useBackendStatus() {
  return useContext(BackendContext);
}

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return `https://churupo-backend.onrender.com`;
  }
  return "http://localhost:8000";
};

export function BackendLoadingProvider({ children }: { children: ReactNode }) {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkBackend = async () => {
      setIsChecking(true);
      try {
        const apiUrl = getApiUrl();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${apiUrl}/docs`, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (mounted) {
          setIsBackendReady(res.ok || res.status === 404 || res.status === 200);
          setIsChecking(false);
        }
      } catch {
        if (mounted) {
          setIsBackendReady(false);
          setIsChecking(false);
        }
      }
    };

    checkBackend();

    const interval = setInterval(() => {
      if (!isBackendReady) {
        checkBackend();
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isBackendReady]);

  if (isChecking && !isBackendReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-main)",
        }}
      >
        <CpuArchitectureLoading
          text="CHURUPO"
          subtext="Conectando con el servidor..."
          size="lg"
        />
      </div>
    );
  }

  return (
    <BackendContext.Provider value={{ isBackendReady, isChecking }}>
      {children}
    </BackendContext.Provider>
  );
}
