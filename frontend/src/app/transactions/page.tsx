"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
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

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Transacciones</h1>
            <p className="page-subtitle">{transactions.length} registros</p>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              Cargando...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              💳 No hay transacciones aún
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.transaction_date).toLocaleDateString("es")}</td>
                      <td>{tx.description || "Sin descripción"}</td>
                      <td>
                        <span className={tx.currency === "USD" ? "text-green" : "text-secondary"}>
                          {tx.currency} {tx.amount.toFixed(2)}
                        </span>
                        {tx.usd_equivalent && tx.currency === "VES" && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            ≈ ${tx.usd_equivalent.toFixed(2)} USD
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${tx.source === "csv" ? "badge-blue" : "badge-gray"}`}>
                          {tx.source === "csv" ? "CSV" : "Manual"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
