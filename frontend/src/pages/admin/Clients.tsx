import { useEffect, useMemo, useState } from "react";
import clientsCss from "../../styles/clients.css?inline";
import { usePageStyle } from "../../hooks/usePageStyle";
import { api } from "../../lib/api";
import { AdminGate } from "../../components/admin/AdminGate";
import { AdminNav } from "../../components/admin/AdminNav";

interface Order {
  id: number;
  amount: number;
  status: string;
  date: string;
  product: {
    name: string;
    size: string;
    quantity: number;
    price: number;
  };
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;

  address: {
    house: string;
    street: string;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };

  orders: Order[];
}

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
    api.get<Client[]>("/admin/clients/details")
      .then((r) => setClients((r.data as Client[]) ?? []))
      .catch(() => setError(true));
  }, []);


  if (error) return <div className="wrap"><div id="loader"><span style={{ color: "var(--cherry)" }}>Backend Connection Refused.</span> Ensure the API server is active.</div></div>;
  if (!clients) return <div className="wrap"><div id="loader">Retrieving Global Clientele Database...</div></div>;

  const filtered = filter === "all" ? clients : clients;

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

  <div className="mbcard">
    <div className="mbcard-label">
      Total Clients
    </div>

    <div className="mbcard-val">
      {clients.length}
    </div>

    <div className="mbcard-sub">
      Registered Customers
    </div>
  </div>


  <div className="mbcard">
    <div className="mbcard-label">
      Total Orders
    </div>

    <div className="mbcard-val">
      {
        clients.reduce(
          (sum, c) => sum + c.orders.length,
          0
        )
      }
    </div>

    <div className="mbcard-sub">
      All Orders
    </div>
  </div>


  <div className="mbcard">
    <div className="mbcard-label">
      Paid Orders
    </div>

    <div className="mbcard-val">
      {
        clients.reduce(
          (sum, c) =>
            sum +
            c.orders.filter(
              o => o.status === "paid"
            ).length,
          0
        )
      }
    </div>

    <div className="mbcard-sub">
      Successful Payments
    </div>
  </div>


  <div className="mbcard">
    <div className="mbcard-label">
      Revenue
    </div>

    <div className="mbcard-val">
      ₹
      {
        clients.reduce(
          (sum,c)=>
            sum +
            c.orders.reduce(
              (s,o)=>s+o.amount,
              0
            ),
          0
        ).toLocaleString("en-IN")
      }
    </div>

    <div className="mbcard-sub">
      Lifetime Sales
    </div>
  </div>


</div>

        <div className="client-grid">

          {
            clients.map((c) => (
              <div className="ccard" key={c.id}>

                <div className="ccard-top">

                  <div className="ccard-avatar">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                </div>


                <h2>{c.name}</h2>

                <p>{c.email}</p>

                <p>
                  📞 {c.phone}
                </p>


                <hr />


                <h3>Address</h3>

                <p>
                  {c.address.house},
                  {c.address.street}
                </p>

                <p>
                  {c.address.city}, {c.address.state}
                </p>

                <p>
                  {c.address.pincode}, {c.address.country}
                </p>


                <hr />


                <h3>
                  Orders ({c.orders.length})
                </h3>


                {
                  c.orders.length === 0 ?

                    <p>No orders yet</p>

                    :

                    c.orders.map((o) => (

                      <div className="order-box" key={o.id}>


                        <strong>
                          Order #{o.id}
                        </strong>


                        <p>
                          Product: {o.product.name}
                        </p>


                        <p>
                          Size: {o.product.size}
                        </p>


                        <p>
                          Quantity: {o.product.quantity}
                        </p>


                        <p>
                          Amount:
₹{(o.amount / 100).toLocaleString("en-IN")}
                        </p>


                        <p>
                          Status:
                          {o.status}
                        </p>


                      </div>

                    ))

                }


              </div>
            ))

          }

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
