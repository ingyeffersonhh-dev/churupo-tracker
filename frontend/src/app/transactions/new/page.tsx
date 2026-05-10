"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuthStore, initAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import type { Category } from "@/types";

export default function NewTransactionPage() {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"VES" | "USD">("VES");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", type)
        .order("name")
        .then(({ data }) => setCategories(data || []));
    }
  }, [user, type]);

  useEffect(() => {
    if (amountRef.current) {
      amountRef.current.focus();
    }
  }, []);

  const handleNumpad = useCallback((key: string) => {
    setAmount((prev) => {
      if (key === "." && prev.includes(".")) return prev;
      if (key === "back") return prev.slice(0, -1);
      if (prev.length >= 12) return prev;
      if (prev === "0" && key !== ".") return key;
      return prev + key;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleNumpad(e.key);
      else if (e.key === "." || e.key === ",") handleNumpad(".");
      else if (e.key === "Backspace") handleNumpad("back");
      else if (e.key === "Enter") handleSubmit(new Event("click") as any);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNumpad, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !user) return;

    setSubmitting(true);

    const transactionData = {
      user_id: user.id,
      category_id: categoryId || null,
      amount: parseFloat(amount),
      currency,
      transaction_date: new Date(date).toISOString(),
      description: description || null,
      source: "manual" as const,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      console.error("Error:", error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  const numpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

  if (success) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, background: "rgba(0,204,102,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg style={{ width: 40, height: 40, color: "var(--accent-green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>¡Registrado!</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>Redirigiendo al dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ padding: 8, borderRadius: 8, background: "var(--bg-sidebar)", border: "2px solid var(--border)", cursor: "pointer", marginRight: 8 }}>
            <svg style={{ width: 24, height: 24, color: "var(--text-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>Nuevo {type === "expense" ? "Gasto" : "Ingreso"}</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", background: "var(--bg-sidebar)", borderRadius: 8, padding: 4, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setType("expense")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: type === "expense" ? "var(--accent-red)" : "transparent",
                color: type === "expense" ? "white" : "var(--text-secondary)",
              }}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: type === "income" ? "var(--accent-green)" : "transparent",
                color: type === "income" ? "var(--bg-main)" : "var(--text-secondary)",
              }}
            >
              Ingreso
            </button>
          </div>

          <div style={{ background: "var(--bg-card)", border: "2px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", background: "var(--bg-sidebar)", borderRadius: 8, padding: 4, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setCurrency("VES")}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  background: currency === "VES" ? "var(--bg-card)" : "transparent",
                  color: currency === "VES" ? "var(--text-main)" : "var(--text-secondary)",
                  boxShadow: currency === "VES" ? "var(--shadow-solid-sm)" : "none",
                }}
              >
                VES
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  background: currency === "USD" ? "var(--bg-card)" : "transparent",
                  color: currency === "USD" ? "var(--text-main)" : "var(--text-secondary)",
                  boxShadow: currency === "USD" ? "var(--shadow-solid-sm)" : "none",
                }}
              >
                USD
              </button>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 24, color: "var(--text-muted)", marginRight: 8 }}>{currency === "VES" ? "Bs" : "$"}</span>
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val) && val.length <= 12) setAmount(val);
                }}
                placeholder="0.00"
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  textAlign: "right",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  color: "var(--text-main)",
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {numpadKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleNumpad(key)}
                style={{
                  background: "var(--bg-card)",
                  border: "2px solid var(--border)",
                  borderRadius: 8,
                  padding: "14px 0",
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: key === "back" ? "var(--accent-red)" : "var(--text-main)",
                  transition: "all 0.2s",
                }}
              >
                {key === "back" ? (
                  <svg style={{ width: 24, height: 24, margin: "0 auto" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l-2-2m2 2v-6m0 6l2-2m-2 2H9" />
                  </svg>
                ) : key}
              </button>
            ))}
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="form-select"
            style={{ marginBottom: 12 }}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="form-input"
            style={{ marginBottom: 12 }}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            style={{ marginBottom: 16 }}
          />

          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              border: "2px solid var(--border)",
              cursor: "pointer",
              color: "white",
              background: type === "expense" ? "var(--accent-red)" : "var(--accent-green)",
              opacity: (submitting || !amount || parseFloat(amount) <= 0) ? 0.5 : 1,
            }}
          >
            {submitting ? "Guardando..." : `Registrar ${type === "expense" ? "Gasto" : "Ingreso"}`}
          </button>
        </form>
      </main>
    </div>
  );
}
