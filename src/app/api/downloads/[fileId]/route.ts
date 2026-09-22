import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDownloadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

// Re-checks entitlement and mints a fresh, short-lived link on every
// request, rather than handing out a long-lived or reusable URL.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/downloads/[fileId]">,
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { fileId } = await params;
  const file = await prisma.productFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const paidOrder = await prisma.order.findFirst({
    where: { userId, productId: file.productId, status: "PAID" },
  });
  if (!paidOrder) {
    return new NextResponse("You don't own this.", { status: 403 });
  }

  const url = await getDownloadUrl(file.key, file.filename);
  return NextResponse.redirect(url);
}
