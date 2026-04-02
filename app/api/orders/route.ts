import { buildOrderId, getOrders, saveOrders, type Order, type OrderStatus } from "@/lib/redis";

function corsHeaders(origin?: string | null) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  const requestOrigin = origin || "";
  const finalOrigin = allowedOrigin === "*" ? "*" : (requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin);

  return {
    "Access-Control-Allow-Origin": finalOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin"))
  });
}

export async function GET(req: Request) {
  const orders = await getOrders();
  return Response.json(orders, {
    headers: corsHeaders(req.headers.get("origin"))
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  const orders = await getOrders();

  const order: Order = {
    id: buildOrderId(),
    customerName: data.customerName,
    phone: data.phone,
    pickupType: data.pickupType,
    items: Array.isArray(data.items) ? data.items : [],
    status: "new",
    placedAt: new Date().toISOString()
  };

  orders.unshift(order);
  await saveOrders(orders);

  return Response.json({ success: true, order }, {
    headers: corsHeaders(req.headers.get("origin"))
  });
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const orders = await getOrders();
  const target = orders.find((order) => order.id === data.id);

  if (!target) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: {
        ...corsHeaders(req.headers.get("origin")),
        "Content-Type": "application/json"
      }
    });
  }

  target.status = data.status as OrderStatus;
  await saveOrders(orders);

  return Response.json({ success: true, order: target }, {
    headers: corsHeaders(req.headers.get("origin"))
  });
}

export async function DELETE(req: Request) {
  const data = await req.json();
  const orders = await getOrders();
  const filtered = orders.filter((order) => order.id !== data.id);

  await saveOrders(filtered);

  return Response.json({ success: true }, {
    headers: corsHeaders(req.headers.get("origin"))
  });
}
