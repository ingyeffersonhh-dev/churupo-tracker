"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { getTransactions, createTransaction, deleteTransaction, getCategories } from "@/lib/api";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  usd_equivalent: number;
  category_id: string | null;
  transaction_date: string;
  source: string;
}

interface Category { id: string; name: string; type: string; }

const SOURCE_LABELS: Record<string, string> = {
  manual:   "✏️ Manual",
  csv:      "📄 CSV",
  telegram: "🤖 Telegram",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function TransaccionesPage() {
  const [txs, setTxs]       = useState<Transaction[]>([]);
  const [cats, setCats]     = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("");
  const [filterSrc,  setFilterSrc]  = useState("");
  const [filterCur,  setFilterCur]  = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [sortBy,     setSortBy]     = useState<"date" | "amount">("date");
  const [sortDir,    setSortDir]    = useState<"desc" | "asc">("desc");

  // ── Form state ────────────────────────────────────────────────────────────
  const [amount,      setAmount]      = useState("");
  const [currency,    setCurrency]    = useState("USD");
  const [description, setDescription] = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [txDate,      setTxDate]      = useState(new Date().toISOString().slice(0, 16));
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txData, catData] = await Promise.all([getTransactions(), getCategories()]);
      setTxs(txData);
      setCats(catData);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await createTransaction({
        amount: parseFloat(amount),
        currency,
        description,
        category_id: categoryId || undefined,
        transaction_date: new Date(txDate).toISOString(),
      });
      setShowModal(false);
      setAmount(""); setDescription(""); setCategoryId(""); setCurrency("USD");
      await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;
    try {
      await deleteTransaction(id);
      setTxs((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      console.error(e);
    }
  }

  function resetFilters() {
    setSearch(""); setFilterCat(""); setFilterSrc(""); setFilterCur("");
    setDateFrom(""); setDateTo(""); setSortBy("date"); setSortDir("desc");
  }

  const catMap = useMemo(() => {
    return Object.fromEntries((cats || []).map((c) => [c.id, c.name]));
  }, [cats]);

  // ── Client-side filtering & sorting ──────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...txs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        (t.description || "").toLowerCase().includes(q) ||
        (catMap[t.category_id || ""] || "").toLowerCase().includes(q)
      );
    }
    if (filterCat)  result = result.filter((t) => t.category_id === filterCat);
    if (filterSrc)  result = result.filter((t) => t.source === filterSrc);
    if (filterCur)  result = result.filter((t) => t.currency === filterCur);
    if (dateFrom)   result = result.filter((t) => t.transaction_date >= new Date(dateFrom).toISOString());
    if (dateTo)     result = result.filter((t) => t.transaction_date <= new Date(dateTo + "T23:59:59").toISOString());

    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "date") {
        const da = new Date(a.transaction_date).getTime() || 0;
        const db = new Date(b.transaction_date).getTime() || 0;
        return dir * (da - db);
      }
      const va = a.usd_equivalent || 0;
      const vb = b.usd_equivalent || 0;
      return dir * (va - vb);
    });

    return result;
  }, [txs, search, filterCat, filterSrc, filterCur, dateFrom, dateTo, sortBy, sortDir, catMap]);

  const activeFilterCount = [search, filterCat, filterSrc, filterCur, dateFrom, dateTo]
    .filter(Boolean).length;

  const totalFiltered = useMemo(() => {
    return (filtered || []).reduce((s, t) => s + (Number(t.usd_equivalent) || 0), 0);
  }, [filtered]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Transacciones</h1>
            <p className="page-subtitle">
              {loading ? "Cargando..." : `${filtered.length} de ${txs.length} registros`}
              {!loading && filtered.length > 0 && (
                <span style={{ marginLeft: 8, color: "var(--accent)", fontWeight: 700 }}>
                  · Total: ${totalFiltered.toFixed(2)} USD
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn-toggle-filters"
              className={`btn ${showFilters ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setShowFilters((p) => !p)}
              style={{ position: "relative" }}
            >
              🔍 Filtros
              {activeFilterCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: "var(--accent-red)", color: "#fff",
                  borderRadius: "50%", width: 18, height: 18,
                  fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, border: "2px solid var(--bg-main)",
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button id="btn-new-transaction" className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Nueva
            </button>
          </div>
        </div>

        {/* ── Filter Panel ─────────────────────────────────────────────── */}
        {showFilters && (
          <div className="card" style={{ marginBottom: 20, padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {/* Search */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Buscar</label>
                <input
                  id="filter-search"
                  type="text"
                  className="form-input"
                  placeholder="Descripción o categoría…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Categoría</label>
                <select id="filter-cat" className="form-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                  <option value="">Todas</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Source */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Fuente</label>
                <select id="filter-src" className="form-select" value={filterSrc} onChange={(e) => setFilterSrc(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="manual">✏️ Manual</option>
                  <option value="csv">📄 CSV</option>
                  <option value="telegram">🤖 Telegram</option>
                </select>
              </div>

              {/* Currency */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Moneda</label>
                <select id="filter-cur" className="form-select" value={filterCur} onChange={(e) => setFilterCur(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="USD">USD 💵</option>
                  <option value="VES">VES 🇻🇪</option>
                </select>
              </div>

              {/* Date From */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Desde</label>
                <input id="filter-date-from" type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>

              {/* Date To */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Hasta</label>
                <input id="filter-date-to" type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              {/* Sort */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ordenar por</label>
                <div className="flex gap-2">
                  <select
                    id="filter-sort-by"
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                    style={{ flex: 1 }}
                  >
                    <option value="date">Fecha</option>
                    <option value="amount">Monto</option>
                  </select>
                  <button
                    id="btn-sort-dir"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    title={sortDir === "desc" ? "Descendente" : "Ascendente"}
                    style={{ flexShrink: 0, fontSize: 18 }}
                  >
                    {sortDir === "desc" ? "↓" : "↑"}
                  </button>
                </div>
              </div>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <button id="btn-reset-filters" className="btn btn-ghost btn-sm" onClick={resetFilters}>
                  ✕ Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            {loading ? (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Descripción</th><th>Categoría</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                    <th style={{ textAlign: "right" }}>USD Equiv.</th>
                    <th style={{ textAlign: "center" }}>Fuente</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td><div className="skeleton-line" style={{ width: 80, height: 12 }} /></td>
                      <td><div className="skeleton-line" style={{ width: 150, height: 12 }} /></td>
                      <td><div className="skeleton-line" style={{ width: 70, height: 20, borderRadius: 10 }} /></td>
                      <td style={{ textAlign: "right" }}><div className="skeleton-line" style={{ width: 60, height: 12, marginLeft: "auto" }} /></td>
                      <td style={{ textAlign: "right" }}><div className="skeleton-line" style={{ width: 60, height: 12, marginLeft: "auto" }} /></td>
                      <td style={{ textAlign: "center" }}><div className="skeleton-line" style={{ width: 50, height: 12, margin: "0 auto" }} /></td>
                      <td><div className="skeleton-line" style={{ width: 24, height: 24, borderRadius: 4 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {txs.length === 0 ? "📭" : "🔍"}
                </div>
                <p>
                  {txs.length === 0
                    ? "No hay transacciones aún."
                    : "Ninguna transacción coincide con los filtros."}
                </p>
                {txs.length === 0 ? (
                  <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    Registrar primera transacción
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={resetFilters}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={() => { setSortBy("date"); setSortDir((d) => sortBy === "date" ? (d === "asc" ? "desc" : "asc") : "desc"); }}
                    >
                      Fecha {sortBy === "date" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th
                      style={{ textAlign: "right", minWidth: "120px", cursor: "pointer", userSelect: "none" }}
                      onClick={() => { setSortBy("amount"); setSortDir((d) => sortBy === "amount" ? (d === "asc" ? "desc" : "asc") : "desc"); }}
                    >
                      Monto {sortBy === "amount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th style={{ textAlign: "right", minWidth: "120px" }}>USD Equiv.</th>
                    <th style={{ textAlign: "center" }}>Fuente</th>
                    <th style={{ textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(tx.transaction_date)}</td>
                      <td className="font-semibold">{tx.description || "—"}</td>
                      <td>
                        {tx.category_id ? (
                          <span className="badge badge-blue">{catMap[tx.category_id] || "?"}</span>
                        ) : (
                          <span className="text-muted text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 700 }}>
                          {tx.currency === "VES"
                            ? `${Number(tx.amount).toLocaleString("es-VE")} Bs`
                            : `$${Number(tx.amount).toFixed(2)}`}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }} className="text-accent font-semibold">
                        ${Number(tx.usd_equivalent || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <span className="text-muted text-xs">{SOURCE_LABELS[tx.source] || tx.source}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          id={`btn-delete-${tx.id}`}
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(tx.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Modal ─────────────────────────────────────────────────────── */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Nueva Transacción</h2>
              <p className="modal-subtitle">Registra un gasto o ingreso manual</p>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Monto</label>
                    <input
                      id="tx-amount" type="number" step="0.01" min="0.01"
                      className="form-input" placeholder="0.00"
                      value={amount} onChange={(e) => setAmount(e.target.value)} required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Moneda</label>
                    <select id="tx-currency" className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD 💵</option>
                      <option value="VES">VES 🇻🇪</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input
                    id="tx-description" type="text" className="form-input"
                    placeholder="Ej: Almuerzo en restaurante"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select id="tx-category" className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Sin categoría</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha y Hora</label>
                  <input
                    id="tx-date" type="datetime-local" className="form-input"
                    value={txDate} onChange={(e) => setTxDate(e.target.value)} required
                  />
                </div>

                {formError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--accent-red)" }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button id="btn-save-transaction" type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? "Guardando..." : "💾 Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
