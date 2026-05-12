// inventory.alerts.jsx — Low Stock Alerts, fully static localStorage-backed
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Section, Btn } from "@/components/PageHelpers";
import { stockStore } from "@/lib/store";
import { AlertTriangle, ShoppingCart, RefreshCw, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/inventory/alerts")({
  head: () => ({ meta: [{ title: "Low Stock Alerts — BrushPack" }] }),
  component: Page,
});

// Supplier lookup for known items
const SUPPLIERS = {
  "Cardboard Boxes - Small":      { supplier: "PackKraft Industries", eta: "2 days" },
  "Blister Cards - 18mm":         { supplier: "ClearPlast Co.",       eta: "3 days" },
  "Sealing Tape - 48mm":          { supplier: "AdhesivePro",          eta: "1 day"  },
};

function enrich(item) {
  const s = SUPPLIERS[item.name] ?? { supplier: "TBD", eta: "Pending" };
  return { ...item, ...s };
}

function Page() {
  const [alerts, setAlerts]       = useState(() => stockStore.getLowStock().map(enrich));
  const [reordered, setReordered] = useState([]);
  const [toast, setToast]         = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  /* Refresh reads latest from store */
  const refresh = () => {
    setAlerts(stockStore.getLowStock().map(enrich));
    setReordered([]);
    showToast("✓ Alerts refreshed.");
  };

  /* Reorder — marks item as ordered (UI only; in a real app this would place an order) */
  const handleReorder = (id, name) => {
    if (reordered.includes(id)) return;
    setReordered((prev) => [...prev, id]);
    showToast(`✓ Reorder placed for "${name}".`);
  };

  return (
    <DashboardLayout
      title="Low Stock Alerts"
      subtitle="Packaging materials below minimum threshold — reorder soon."
      lowStockItems={alerts}
    >
      {/* Toast */}
      {toast && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Banner */}
      <div className="rounded-2xl bg-warm/15 border border-accent/30 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 hover-lift">
        <div className="h-10 w-10 rounded-full bg-accent grid place-items-center text-accent-foreground shrink-0 animate-float">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">
            {alerts.length === 0 ? "All stock levels are healthy." : `${alerts.length} item${alerts.length > 1 ? "s" : ""} need attention`}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {alerts.length > 0 ? "Reorder these to avoid packing line halts." : "No items are currently below the minimum threshold."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={refresh}
            className="text-muted-foreground hover:text-foreground transition"
            title="Refresh alerts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link to="/inventory/stock" className="text-sm text-primary hover:underline whitespace-nowrap">
            View all stock →
          </Link>
        </div>
      </div>

      <Section title="Items below minimum">
        {alerts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All stock levels are healthy. No reorders needed.</p>
            <div className="mt-4">
              <Link to="/inventory/stock">
                <Btn variant="ghost">View Inventory</Btn>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((a, i) => {
              const deficit   = a.min - a.qty;
              const pct       = Math.round((a.qty / a.min) * 100);
              const ordered   = reordered.includes(a.id);

              return (
                <li
                  key={a.id ?? a.name}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="animate-fade-in py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Supplier: {a.supplier} · ETA {a.eta}
                    </div>
                    <div className="mt-1.5 h-1.5 w-full max-w-[200px] rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-sm whitespace-nowrap">
                    <span className="text-destructive font-medium">{a.qty.toLocaleString()} {a.unit}</span>
                    <span className="text-muted-foreground"> / {a.min.toLocaleString()} min</span>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    Short by {deficit.toLocaleString()} {a.unit}
                  </div>

                  {/* Reorder button */}
                  {ordered ? (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium whitespace-nowrap">
                      <CheckCircle className="h-4 w-4" /> Ordered
                    </div>
                  ) : (
                    <Btn variant="accent" onClick={() => handleReorder(a.id ?? a.name, a.name)}>
                      <ShoppingCart className="h-4 w-4" /> Reorder
                    </Btn>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </DashboardLayout>
  );
}
