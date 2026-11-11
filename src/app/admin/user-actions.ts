"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function approveUser(id: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { approved: true } });
  revalidatePath("/admin/users");
}

export async function revokeUser(id: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { approved: false } });
  revalidatePath("/admin/users");
}

// Orders hold payment records, and Order.user restricts deletes, so a user with
// any order history stays.
export async function deleteUser(id: string) {
  await requireAdmin();

  const orderCount = await prisma.order.count({ where: { userId: id } });
  if (orderCount > 0) {
    return;
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
