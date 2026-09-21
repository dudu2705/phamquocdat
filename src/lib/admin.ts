import { cache } from "react";
import { redirect } from "next/navigation";
import { adminAuth } from "@/admin-auth";
import { prisma } from "@/lib/prisma";

// Checks the database on every call, so removing an admin row revokes access immediately.
export const requireAdmin = cache(async () => {
  const session = await adminAuth();
  const id = session?.user?.id;

  if (id) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (admin) {
      return admin;
    }
  }

  redirect("/admin/login");
});
