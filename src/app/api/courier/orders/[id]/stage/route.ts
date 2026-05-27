import { NextResponse } from "next/server";
import { getCurrentCourier } from "@/server/courier-auth";
import {
  getOrderById,
  updateCourierStage,
} from "@/server/orders-store";
import type { CourierStage } from "@/lib/types";

const ALLOWED: CourierStage[] = [
  "dispatching",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "arrived_dropoff",
  "completed",
  "failed",
];

type Params = { id: string };

export async function POST(
  req: Request,
  context: { params: Promise<Params> }
) {
  const courier = await getCurrentCourier();
  if (!courier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.courierId !== courier.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { stage?: string };
  try {
    body = (await req.json()) as { stage?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const stage = body.stage as CourierStage | undefined;
  if (!stage || !ALLOWED.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const updated = await updateCourierStage(id, stage);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, order: updated });
}
