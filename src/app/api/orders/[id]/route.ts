import { NextResponse } from "next/server";
import { getOrderById } from "@/server/orders-store";
import { getCourierById } from "@/server/couriers-store";

type Params = { id: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;

  // Validate order ID format to prevent enumeration
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return only minimal status info needed by the client-side polling.
  // Sensitive fields (address, phone, items, amounts) are NOT exposed.
  const courier = order.courierId
    ? await getCourierById(order.courierId)
    : null;

  return NextResponse.json({
    id: order.id,
    status: order.status,
    courierId: order.courierId ?? null,
    courier:
      courier && order.status === "courier"
        ? { name: courier.name, phone: courier.phone }
        : null,
  });
}
