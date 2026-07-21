import { useEffect, useMemo, useState } from "react";
import clientsCss from "../../styles/clients.css?inline";
import { usePageStyle } from "../../hooks/usePageStyle";
import { api } from "../../lib/api";
import { AdminGate } from "../../components/admin/AdminGate";
import { AdminNav } from "../../components/admin/AdminNav";

interface Client { client_email: string; total_orders: number; ltv: number; last_active: string | null; }

function getTier(ltv: number): { cls: string; label: string } {
  if (ltv > 100000) return { cls: "diamond", label: "💎 Diamond" };
  if (ltv > 50000) return { cls: "gold-tier", label: "✦ Gold Atelier" };
  if (ltv > 20000) return { cls: "vip", label: "★ VIP" };
  return { cls: "standard", label: "Standard" };
}

const TIER_BTNS = [
  { key: "all", label: "All Clients" },
  { key: "diamond", label: "💎 Diamond" },
  { key: "gold-tier", label: "✦ Gold Atelier" },
  { key: "vip", label: "★ VIP" },
  { key: "standard", label: "Standard" },
];

function ClientsInner() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get<Client[]>("/admin/clients")
      .then((r) => setClients((r.data as Client[]) ?? []))
      .catch(() => setError(true));
  }, []);

  const counts = useMemo(() => {
    const c = { diamond: 0, "gold-tier": 0, vip: 0, standard: 0 } as Record<string, number>;
    (clients ?? []).forEach((cl) => { c[getTier(cl.ltv).cls] += 1; });
    return c;
  }, [clients]);

  if (error) return <div className="wrap"><div id="loader"><span style={{ color: "var(--cherry)" }}>Backend Connection Refused.</span> Ensure the API server is active.</div></div>;
  if (!clients) return <div className="wrap"><div id="loader">Retrieving Global Clientele Database...</div></div>;

  const filtered = filter === "all" ? clients : clients.filter((c) => getTier(c.ltv).cls === filter);

  return (
    <div className="wrap">
      <div id="dcontent">
        <div className="page-hero">
          <div>
            <div className="page-kicker">Client CRM</div>
            <h1 className="page-hero-title">Global Clientele <span>Database</span></h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--mu)", marginBottom: "0.3rem" }}>Total Patrons</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: "2.5rem", fontWeight: 300, color: "var(--gold)" }}>{clients.length}</div>
          </div>
        </div>

        <div className="metrics-bar">
          <div className="mbcard"><div className="mbcard-label">Diamond Patrons</div><div className="mbcard-val">{counts.diamond}</div><div className="mbcard-sub">LTV &gt; ₹1,00,000</div></div>
          <div className="mbcard"><div className="mbcard-label">Gold Atelier</div><div className="mbcard-val">{counts["gold-tier"]}</div><div className="mbcard-sub">LTV ₹50k – ₹1L</div></div>
          <div className="mbcard"><div className="mbcard-label">VIP Patrons</div><div className="mbcard-val">{counts.vip}</div><div className="mbcard-sub">LTV ₹20k – ₹50k</div></div>
          <div className="mbcard"><div className="mbcard-label">Standard Clients</div><div className="mbcard-val">{counts.standard}</div><div className="mbcard-sub">LTV &lt; ₹20,000</div></div>
        </div>

        <div className="tier-filter">
          {TIER_BTNS.map((t) => (
            <button key={t.key} className={`tier-btn${filter === t.key ? " active" : ""}`} onClick={() => setFilter(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className="client-grid">
          {filtered.length === 0 ? (
            <p style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--mu)", fontStyle: "italic" }}>No clients in this tier.</p>
          ) : (
            filtered.map((c) => {
              const tier = getTier(c.ltv);
              const lastDate = c.last_active ? new Date(c.last_active).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";
              return (
                <div className="ccard" key={c.client_email} data-tier={tier.cls}>
                  <div className="ccard-top">
                    <div className="ccard-avatar">{c.client_email ? c.client_email.charAt(0).toUpperCase() : "?"}</div>
                    <span className={`tier-badge ${tier.cls}`}>{tier.label}</span>
                  </div>
                  <div className="ccard-email">{c.client_email}</div>
                  <div className="ccard-orders">{c.total_orders} piece{c.total_orders !== 1 ? "s" : ""} commissioned</div>
                  <div className="ccard-divider" />
                  <div className="ccard-stats">
                    <div>
                      <div className="ccard-stat-label">Lifetime Value</div>
                      <div className="ccard-stat-val highlight">₹{c.ltv.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="ccard-stat-label">Last Active</div>
                      <div className="ccard-stat-val">{lastDate}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function Clients() {
  usePageStyle(clientsCss, "tb-clients-style");
  return (
    <AdminGate>
      <AdminNav active="clients" />
      <ClientsInner />
    </AdminGate>
  );
}
