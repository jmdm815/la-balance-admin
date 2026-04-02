"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "new" | "preparing" | "ready" | "picked_up" | "cancelled";
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
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled"
};

const sectionOrder: OrderStatus[] = ["new", "preparing", "ready", "picked_up", "cancelled"];

function OrderCard({
  order,
  onStatusChange,
  onDelete
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}) {
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const nextStatuses: OrderStatus[] = ["new", "preparing", "ready", "picked_up", "cancelled"];

  return (
    <article className="order-card">
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
        {nextStatuses.map((status) => (
          <button
            key={status}
            className={order.status === status ? "primary-button compact" : "secondary-button compact"}
            onClick={() => onStatusChange(order.id, status)}
          >
            {labels[status]}
          </button>
        ))}
        <button className="danger-button compact" onClick={() => onDelete(order.id)}>
          Delete order
        </button>
      </div>
    </article>
  );
}

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

  async function deleteOrder(id: string) {
    try {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error(`Failed to delete order: ${response.status}`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const groupedOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    return Object.fromEntries(sectionOrder.map((status) => [status, sorted.filter((order) => order.status === status)])) as Record<OrderStatus, Order[]>;
  }, [orders]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Expanded workflow</p>
          <h2>Incoming pickup orders</h2>
          <p className="hero-copy">
            Orders are now split into live sections for new, preparing, ready, picked up, and cancelled.
          </p>
        </div>
        <div className="hero-card">
          <strong>Status</strong>
          <p>{error || "Admin app loaded successfully."}</p>
        </div>
      </section>

      {sectionOrder.map((status) => (
        <section key={status} className="status-section">
          <div className="section-heading">
            <h3>{labels[status]}</h3>
            <span className="section-count">{groupedOrders[status].length}</span>
          </div>

          {groupedOrders[status].length === 0 ? (
            <div className="empty-panel">No orders in this section.</div>
          ) : (
            <div className="orders-grid">
              {groupedOrders[status].map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateStatus}
                  onDelete={deleteOrder}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
