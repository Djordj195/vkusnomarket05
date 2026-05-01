import { NextResponse } from "next/server";
import { getOrderById } from "@/server/orders-store";
import { getCourierById } from "@/server/couriers-store";

type Params = { id: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const courier = order.courierId
    ? await getCourierById(order.courierId)
    : null;

  return NextResponse.json({
    id: order.id,
    status: order.status,
    courierId: order.courierId,
    courier:
      courier && order.status === "courier"
        ? { name: courier.name, phone: courier.phone }
        : null,
  });
}
