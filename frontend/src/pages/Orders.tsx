import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, assetUrl } from "../lib/api";
import ordersCss from "../styles/orders.css?inline";
import { usePageStyle } from "../hooks/usePageStyle";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  img: string;
  status: string;
  ordered_at: string;
  expected_delivery: string;
}

export function Orders() {
  usePageStyle(ordersCss, "tb-orders-style");

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<OrderItem[]>("/orders/mine")
      .then((r) => setOrders((r.data as OrderItem[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  function statusLabel(status: string) {
    switch (status) {
      case "paid":
        return "Preparing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  }

  function statusClass(status: string) {
    switch (status) {
      case "paid":
        return "prep";
      case "shipped":
        return "ship";
      case "delivered":
        return "done";
      case "cancelled":
        return "cancel";
      default:
        return "pending";
    }
  }

  if (loading) {
    return <div className="orders-loader">Loading your orders…</div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <Link to="/" className="back-link">← Back</Link>
        <h1>📦 My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders yet.</p>
          <Link to="/#shop" className="shop-btn">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-image">
                <img
                  src={assetUrl((order.img || "").split(",")[0]?.trim() || "")}
                  alt={order.product_name}
                />
              </div>

              <div className="order-body">
                <div className="order-top">
                  <h3>{order.product_name}</h3>
                  <span className={`status ${statusClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="order-price">
                  ₹{order.unit_price.toLocaleString("en-IN")}
                </div>

                <div className="order-meta">
                  <div><strong>Order #</strong> TB{order.id}</div>
                  <div><strong>Qty:</strong> {order.quantity}</div>
                  <div>
                    <strong>Ordered:</strong> {new Date(order.ordered_at).toLocaleDateString("en-IN")}
                  </div>
                  <div>
                    <strong>Expected Delivery:</strong> {new Date(order.expected_delivery).toLocaleDateString("en-IN")}
                  </div>
                </div>

                <div className="timeline">
                  <div className="step active">✓ Order Placed</div>
                  <div className={`step ${order.status !== "pending" ? "active" : ""}`}>
                    ✓ Payment Confirmed
                  </div>
                  <div className={`step ${order.status === "shipped" || order.status === "delivered" ? "active" : ""}`}>
                    🚚 Shipped
                  </div>
                  <div className={`step ${order.status === "delivered" ? "active" : ""}`}>
                    🏠 Delivered
                  </div>
                </div>

                <div className="order-actions">
                  <Link
                    to={`/product?id=${order.product_id}`}
                    className="action-btn primary"
                  >
                    View Product
                  </Link>

                  <a
                    href={`https://wa.me/9183268890?text=${encodeURIComponent(
                      `Hi Tanesha Baxi, I need help with Order TB${order.id} (${order.product_name}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="action-btn"
                  >
                    Need Help
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}