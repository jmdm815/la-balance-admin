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

const globalForOrders = globalThis as unknown as { ordersStore?: Order[] };

if (!globalForOrders.ordersStore) {
  globalForOrders.ordersStore = [];
}

function getOrders() {
  return globalForOrders.ordersStore as Order[];
}

export async function GET() {
  return Response.json(getOrders());
}

export async function POST(req: Request) {
  const data = await req.json();

  const order: Order = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    customerName: data.customerName,
    phone: data.phone,
    pickupType: data.pickupType,
    items: data.items ?? [],
    status: "new",
    placedAt: new Date().toISOString()
  };

  getOrders().unshift(order);
  return Response.json({ success: true, order });
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const orders = getOrders();
  const target = orders.find((order) => order.id === data.id);

  if (!target) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
  }

  target.status = data.status;
  return Response.json({ success: true, order: target });
}
