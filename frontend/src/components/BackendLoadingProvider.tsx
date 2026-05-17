"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { CpuArchitectureLoading } from "@/components/CpuArchitectureLoading";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return `https://churupo-backend.onrender.com`;
  }
  return "http://localhost:8000";
};

export function BackendLoadingProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    const checkBackend = async () => {
      setIsChecking(true);
      try {
        const apiUrl = getApiUrl();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${apiUrl}/docs`, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (mounted) {
          if (res.ok || res.status === 404 || res.status === 200) {
            setIsBackendReady(true);
          } else {
            setIsBackendReady(false);
          }
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

  useEffect(() => {
    if (isBackendReady && !isChecking) {
      const elapsed = Date.now() - startTime.current;
      const minDuration = 2000;
      const remaining = Math.max(0, minDuration - elapsed);

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isBackendReady, isChecking]);

  if (showSplash) {
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

  return children;
}
