import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    redirect("/login");
  }

  return { id, email: session.user?.email ?? null, name: session.user?.name ?? null };
}
