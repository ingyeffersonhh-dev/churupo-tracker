"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">¡Registrado!</h2>
            <p className="text-gray-500 mt-2">Redirigiendo al dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nuevo {type === "expense" ? "Gasto" : "Ingreso"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
                type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
                type === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCurrency("VES")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    currency === "VES" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  VES
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    currency === "USD" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl text-gray-400">{currency === "VES" ? "Bs" : "$"}</span>
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
                className="text-4xl font-bold text-right bg-transparent outline-none w-full ml-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 md:hidden">
            {numpadKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleNumpad(key)}
                className={`bg-white border border-gray-200 rounded-lg py-3.5 text-xl font-medium active:bg-gray-100 transition ${
                  key === "back" ? "text-red-500" : ""
                }`}
              >
                {key === "back" ? (
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l-2-2m0 0l-2 2m0 0l2 2M9 12l.01 0M15 12l.01 0" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className={`w-full py-4 rounded-xl text-lg font-semibold text-white transition ${
              type === "expense"
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                : "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            } disabled:cursor-not-allowed`}
          >
            {submitting ? "Guardando..." : `Registrar ${type === "expense" ? "Gasto" : "Ingreso"}`}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
