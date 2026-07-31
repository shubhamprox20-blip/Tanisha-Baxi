import { useEffect, useState } from "react";
import adminCss from "../../styles/admin.css?inline";
import { usePageStyle } from "../../hooks/usePageStyle";
import { api } from "../../lib/api";
import { AdminGate } from "../../components/admin/AdminGate";
import { AdminNav } from "../../components/admin/AdminNav";

interface Order { id: number; product_name: string | null; client_email: string; amount: number; status: string; }
interface Appointment { id: number; client_name: string; consultation_type: string; appointment_date: string; }
interface AdminUser {
  id: number; first_name: string; last_name: string; email: string; phone: string;
  city: string; state: string; country: string; role: string; created_at: string;
}
interface Dashboard {
  metrics: { total_revenue: number; total_orders: number; today_visitors: number };
  orders: Order[];
  appointments: Appointment[];
}

function DashboardInner() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<never>("/admin/dashboard"),
      api.get<AdminUser[]>("/admin/users"),
    ])
      .then(([dash, usr]) => {
        setData(dash as unknown as Dashboard);
        setUsers((usr.data as AdminUser[]) ?? []);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <div className="wrap"><div id="loader"><span style={{ color: "red" }}>Backend Connection Refused.</span> Ensure the API server is active.</div></div>;
  }
  if (!data) {
    return <div className="wrap"><div id="loader">Connecting to backend database...</div></div>;
  }

  return (
    <div className="wrap">
      <div id="dcontent">
        <div className="mgrid">
          <div className="mtr">
            <div className="mtr-title">Total Revenue ytd</div>
            <div className="mtr-val">₹{data.metrics.total_revenue.toLocaleString("en-IN")}</div>
            <div className="mtr-sub">Paid orders</div>
          </div>
          <div className="mtr">
            <div className="mtr-title">Paid Orders</div>
            <div className="mtr-val">{data.metrics.total_orders}</div>
            <div className="mtr-sub">Confirmed</div>
          </div>
          <div className="mtr">
            <div className="mtr-title">Site Traffic Today</div>
            <div className="mtr-val green">{data.metrics.today_visitors.toLocaleString()}</div>
            <div className="mtr-sub">Unique global visitors</div>
          </div>
        </div>

        <div className="main-grid">
          <div>
            <h2 className="sec-head">Recent Transactions</h2>
            <div className="tbl-w">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Garment</th><th>Client</th><th>Value</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: "var(--mu)" }}>#TXN-{1000 + o.id}</td>
                      <td style={{ fontFamily: "var(--fd)" }}>{o.product_name ?? "—"}</td>
                      <td style={{ color: "var(--mu)", fontSize: "0.8rem" }}>{o.client_email}</td>
                      <td>₹{Math.round(o.amount / 100).toLocaleString("en-IN")}</td>
                      <td><span className={`st ${o.status.toLowerCase()}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="sec-head">Atelier Bookings</h2>
            <div className="agrid">
              {data.appointments.map((a) => (
                <div className="acard" key={a.id}>
                  <h4>{a.client_name}</h4>
                  <div className="atype">{a.consultation_type}</div>
                  <div className="adate">{a.appointment_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
  style={{
    margin: "2rem 0",
    padding: "1.5rem",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.02)",
  }}
>
  <h2 className="sec-head">Homepage Hero Image</h2>

  <p style={{ color: "var(--mu)", marginBottom: "1rem" }}>
    Upload a new homepage hero image. The previous image will be replaced automatically.
  </p>

  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const form = new FormData();
      form.append("file", file);

      try {
        setUploadingHero(true);

        await api.post("/admin/upload-hero", form);

        alert("Hero image updated successfully!");
      } catch (err) {
        console.error(err);
        alert("Upload failed.");
      } finally {
        setUploadingHero(false);
      }
    }}
  />

  <div style={{ marginTop: "1rem" }}>
    {uploadingHero ? "Uploading..." : ""}
  </div>
</div>

        <div className="users-card">
          <h2 style={{ margin: "3rem 0 1.5rem", fontFamily: "var(--fd)", fontWeight: 300, fontSize: "1.8rem" }}>Registered Users</h2>
          <div className="tbl-w" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>State</th><th>Country</th><th>Role</th><th>Created</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td style={{ fontSize: "0.8rem" }}>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{u.city}</td>
                    <td>{u.state}</td>
                    <td>{u.country}</td>
                    <td><span className={`st ${u.role}`}>{u.role}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--mu)" }}>{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  usePageStyle(adminCss, "tb-admin-style");
  return (
    <AdminGate>
      <AdminNav active="dashboard" />
      <DashboardInner />
    </AdminGate>
  );
}
