// billing.quotation.jsx — Quotations & Orders, fully static localStorage-backed
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Section, Pill, Btn, Stat, Field, inputCls } from "@/components/PageHelpers";
import { billingStore } from "@/lib/store";
import { Plus, X, Check, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/billing/quotation")({
  head: () => ({ meta: [{ title: "Quotation & Orders — BrushPack" }] }),
  component: Page,
});

const STATUSES = ["Draft", "Sent", "Pending", "Accepted", "Received"];
const tone     = (s) => ({ Accepted: "success", Received: "success", Sent: "info", Pending: "warn", Draft: "muted" }[s] ?? "muted");

const EMPTY = { id: "", contractor: "", date: new Date().toISOString().split("T")[0], value: "", status: "Draft" };

function Page() {
  const [records, setRecords]   = useState(() => billingStore.getAll());
  const [activeTab, setActiveTab] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState(EMPTY);
  const [editEntry, setEditEntry] = useState(EMPTY);
  const [toast, setToast]       = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  /* Add new quotation */
  const handleAdd = () => {
    if (!newEntry.id.trim())         { alert("Order ID is required."); return; }
    if (!newEntry.contractor.trim()) { alert("Contractor name is required."); return; }

    // Check for duplicate ID
    if (records.some((r) => r.id === newEntry.id.trim())) {
      alert(`Order ID "${newEntry.id.trim()}" already exists. Use a different ID.`);
      return;
    }

    const record = { ...newEntry, id: newEntry.id.trim(), contractor: newEntry.contractor.trim(), value: Number(newEntry.value) || 0, type: "quote" };
    const updated = billingStore.add(record);
    setRecords(Array.isArray(updated) ? updated : billingStore.getAll());
    setIsAdding(false);
    setNewEntry(EMPTY);
    showToast("✓ Quotation added.");
  };

  /* Save edit */
  const handleEdit = () => {
    if (!editEntry.id.trim() || !editEntry.contractor.trim()) { alert("ID and contractor are required."); return; }
    const updated = billingStore.update(editingId, { ...editEntry, value: Number(editEntry.value) || 0 });
    setRecords(updated);
    setEditingId(null);
    setEditEntry(EMPTY);
    showToast("✓ Record updated.");
  };

  /* Delete */
  const handleDelete = (id) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setRecords(billingStore.remove(id));
    showToast("Record deleted.");
  };

  /* Cancel add/edit */
  const cancelAdd  = () => { setIsAdding(false); setNewEntry(EMPTY); };
  const cancelEdit = () => { setEditingId(null); setEditEntry(EMPTY); };

  const stats = [
    { label: "Accepted", value: records.filter((r) => r.status === "Accepted").length },
    { label: "Sent",     value: records.filter((r) => r.status === "Sent").length     },
    { label: "Pending",  value: records.filter((r) => r.status === "Pending").length  },
  ];

  const displayed = activeTab === "status"
    ? records.filter((r) => r.status !== "Draft")
    : records;

  return (
    <DashboardLayout title="Quotation" subtitle="Manage quotes and track order statuses.">

      {/* Toast */}
      {toast && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Overview cards */}
      <Section title="Quotation Overview">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} />)}
          <button
            onClick={() => setActiveTab((t) => (t === "status" ? "all" : "status"))}
            className={`flex flex-col items-start justify-between rounded-2xl border p-4 sm:p-5 transition-all text-left ${
              activeTab === "status"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-secondary/50 border-border"
            }`}
          >
            <span className="text-xs sm:text-sm font-medium opacity-80 uppercase tracking-wider">Order Tracking</span>
            <span className="mt-2 text-xl sm:text-3xl font-display font-semibold">STATUS</span>
          </button>
        </div>
      </Section>

      <div className="h-5 sm:h-6" />

      {/* Records table */}
      <Section
        title={activeTab === "status" ? "Order Tracking Status" : "All Quotations & Bills"}
        action={
          <div className="flex gap-2">
            <Link to="/billing/create">
              <Btn variant="ghost">Create Invoice</Btn>
            </Link>
            <Btn variant="accent" onClick={() => { setIsAdding(true); cancelEdit(); }}>
              <Plus className="h-4 w-4" /> New Quotation
            </Btn>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 sm:px-6 py-3 text-primary">Order ID</th>
                <th className="px-4 sm:px-6 py-3">Contractor</th>
                <th className="px-4 sm:px-6 py-3">Date</th>
                <th className="px-4 sm:px-6 py-3">Amount</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>

              {/* Add new row */}
              {isAdding && (
                <tr className="bg-secondary/20 border-b border-border">
                  <td className="px-4 sm:px-6 py-2">
                    <input className={inputCls} placeholder="Q-0106" value={newEntry.id} onChange={(e) => setNewEntry({ ...newEntry, id: e.target.value })} />
                  </td>
                  <td className="px-4 sm:px-6 py-2">
                    <input className={inputCls} placeholder="Contractor name" value={newEntry.contractor} onChange={(e) => setNewEntry({ ...newEntry, contractor: e.target.value })} />
                  </td>
                  <td className="px-4 sm:px-6 py-2">
                    <input type="date" className={inputCls} value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
                  </td>
                  <td className="px-4 sm:px-6 py-2">
                    <input type="number" min="0" className={inputCls} placeholder="0" value={newEntry.value} onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })} />
                  </td>
                  <td className="px-4 sm:px-6 py-2">
                    <select className={inputCls} value={newEntry.status} onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 sm:px-6 py-2">
                    <div className="flex gap-1 justify-end">
                      <Btn onClick={handleAdd}><Check className="h-4 w-4" /> Save</Btn>
                      <Btn variant="ghost" onClick={cancelAdd}><X className="h-4 w-4" /></Btn>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {displayed.map((r) =>
                editingId === r.id ? (
                  <tr key={r.id} className="bg-secondary/20 border-b border-border">
                    <td className="px-4 sm:px-6 py-2">
                      <input className={inputCls} value={editEntry.id} onChange={(e) => setEditEntry({ ...editEntry, id: e.target.value })} />
                    </td>
                    <td className="px-4 sm:px-6 py-2">
                      <input className={inputCls} value={editEntry.contractor} onChange={(e) => setEditEntry({ ...editEntry, contractor: e.target.value })} />
                    </td>
                    <td className="px-4 sm:px-6 py-2">
                      <input type="date" className={inputCls} value={editEntry.date} onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })} />
                    </td>
                    <td className="px-4 sm:px-6 py-2">
                      <input type="number" min="0" className={inputCls} value={editEntry.value} onChange={(e) => setEditEntry({ ...editEntry, value: e.target.value })} />
                    </td>
                    <td className="px-4 sm:px-6 py-2">
                      <select className={inputCls} value={editEntry.status} onChange={(e) => setEditEntry({ ...editEntry, status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-2">
                      <div className="flex gap-1 justify-end">
                        <Btn onClick={handleEdit}><Check className="h-4 w-4" /> Save</Btn>
                        <Btn variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Btn>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30 transition">
                    <td className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">{r.id}</td>
                    <td className="px-4 sm:px-6 py-3">{r.contractor}</td>
                    <td className="px-4 sm:px-6 py-3 text-muted-foreground whitespace-nowrap">{r.date}</td>
                    <td className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">
                      ₹{Number(r.value).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <Pill tone={tone(r.status)}>{r.status}</Pill>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditingId(r.id); setEditEntry({ ...r }); cancelAdd(); }}
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}

              {displayed.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No records yet. Click "New Quotation" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </DashboardLayout>
  );
}
