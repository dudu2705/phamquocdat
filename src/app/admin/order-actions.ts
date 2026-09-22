"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Escape hatch for a payment the automatic checker can't resolve (e.g. a
// customer paid a few seconds after the quote expired). Use with judgement:
// it unlocks the download without re-checking the chain.
export async function forcePaidOrder(id: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  redirect("/admin/orders");
}
