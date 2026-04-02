"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "new" | "preparing" | "ready";
type OrderItem = { name: string; price: number; quantity: number; instructions?: string };
type Order = {
  id: string;
  customerName: string;
  phone: string;
  pickupType: "in-store" | "drive-through";
  items: OrderItem[];
  status: OrderStatus;
  placedAt: string;
};

const labels: Record<OrderStatus, string> = {
  new: "New order",
  preparing: "Preparing",
  ready: "Ready for pickup"
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);
      const data = await response.json();
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (!response.ok) throw new Error(`Failed to update order: ${response.status}`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()),
    [orders]
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">CORS-fixed admin</p>
          <h2>Incoming pickup orders</h2>
          <p className="hero-copy">
            This build focuses on reliable cross-site order submission from your customer app.
          </p>
        </div>
        <div className="hero-card">
          <strong>Status</strong>
          <p>{error || "Admin app loaded successfully."}</p>
        </div>
      </section>

      <section className="orders-grid">
        {sortedOrders.length === 0 ? (
          <div className="empty-panel">No orders have been received yet.</div>
        ) : (
          sortedOrders.map((order) => {
            const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return (
              <article key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <div className="order-meta">
                      <span className="order-id">{order.id}</span>
                      <span className={`status-pill status-${order.status}`}>{labels[order.status]}</span>
                    </div>
                    <h3>{order.customerName}</h3>
                    <p className="muted">{order.phone} • {order.pickupType === "in-store" ? "In-store pickup" : "Drive-through pickup"}</p>
                    <p className="muted">Placed at {new Date(order.placedAt).toLocaleString()}</p>
                  </div>
                  <div className="total-box">
                    <span className="muted">Order total</span>
                    <strong>${total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="items-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div>
                        <strong>{item.quantity}× {item.name}</strong>
                        <p className="muted">{item.instructions ? `Instructions: ${item.instructions}` : "No custom instructions"}</p>
                      </div>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="actions">
                  {(["new", "preparing", "ready"] as OrderStatus[]).map((status) => (
                    <button
                      key={status}
                      className={order.status === status ? "primary-button compact" : "secondary-button compact"}
                      onClick={() => updateStatus(order.id, status)}
                    >
                      {labels[status]}
                    </button>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
