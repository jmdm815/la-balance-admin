import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export type OrderStatus = "new" | "preparing" | "ready" | "picked_up" | "cancelled";

export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  instructions?: string;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  pickupType: "in-store" | "drive-through";
  items: OrderItem[];
  status: OrderStatus;
  placedAt: string;
};

const ORDERS_KEY = "restaurant:orders";

export async function getOrders(): Promise<Order[]> {
  const orders = await redis.get<Order[]>(ORDERS_KEY);
  return Array.isArray(orders) ? orders : [];
}

export async function saveOrders(orders: Order[]) {
  await redis.set(ORDERS_KEY, orders);
}

export function buildOrderId() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}
