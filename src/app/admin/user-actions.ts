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
