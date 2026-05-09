"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore, initAuth } from "@/store/auth";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .order("transaction_date", { ascending: false })
      .limit(50);
    setTransactions(data || []);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
            <p className="text-sm text-gray-500 mt-1">{transactions.length} registros</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{tx.description || "Sin descripción"}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.transaction_date).toLocaleDateString("es")} • {tx.source === "csv" ? "CSV" : "Manual"}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.currency === "USD" ? "text-green-600" : "text-gray-900"}`}>
                    {tx.currency} {tx.amount.toFixed(2)}
                  </p>
                  {tx.usd_equivalent && tx.currency === "VES" && (
                    <p className="text-xs text-gray-500">≈ ${tx.usd_equivalent.toFixed(2)} USD</p>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No hay transacciones aún</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
