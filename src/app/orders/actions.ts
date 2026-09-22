"use server";

import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/customer";
import { getEthUsdRate } from "@/lib/eth-price";
import { ORDER_VALIDITY_MINUTES, usdCentsToWei } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/verify-payment";

// The second parameter only exists so this matches useActionState's expected
// action signature once bound to a product id; it's never read.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createOrder(productId: string, _prevState: string | null) {
  const user = await requireUser();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { files: true },
  });
  if (!product || product.files.length === 0) {
    notFound();
  }

  const now = new Date();

  const existing = await prisma.order.findFirst({
    where: {
      userId: user.id,
      productId,
      OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    redirect(`/orders/${existing.id}`);
  }

  const rate = await getEthUsdRate();
  if (!rate) {
    return "ETH price is temporarily unavailable. Try again shortly.";
  }

  const amountWei = usdCentsToWei(product.price, rate);
  const order = await prisma.order.create({
    data: {
      productId,
      userId: user.id,
      usdPriceSnapshot: product.price,
      ethUsdRateSnapshot: rate.usdPerEth,
      amountWei: amountWei.toString(),
      expiresAt: new Date(now.getTime() + ORDER_VALIDITY_MINUTES * 60_000),
    },
  });

  redirect(`/orders/${order.id}`);
}

export async function submitPayment(orderId: string, txHash: string) {
  const user = await requireUser();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id) {
    return { ok: false, error: "Order not found." };
  }
  if (order.status !== "PENDING") {
    return { ok: false, error: "This order is no longer awaiting payment." };
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, error: "That doesn't look like a transaction hash." };
  }

  try {
    await prisma.order.update({ where: { id: orderId }, data: { txHash } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That transaction has already been used for another order." };
    }
    throw error;
  }

  return { ok: true };
}

export type OrderView = {
  id: string;
  status: string;
  amountWei: string;
  expiresAt: string;
  txHash: string | null;
  note: string | null;
  confirmations: number | null;
};

function toView(order: {
  id: string;
  status: string;
  amountWei: string;
  expiresAt: Date;
  txHash: string | null;
  note: string | null;
}): OrderView {
  return {
    id: order.id,
    status: order.status,
    amountWei: order.amountWei,
    expiresAt: order.expiresAt.toISOString(),
    txHash: order.txHash,
    note: order.note,
    confirmations: null,
  };
}

export async function checkOrderStatus(orderId: string): Promise<OrderView | null> {
  const user = await requireUser();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id) {
    return null;
  }

  if (order.status !== "PENDING") {
    return toView(order);
  }

  if (!order.txHash) {
    if (new Date() > order.expiresAt) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "EXPIRED" },
      });
      return toView(updated);
    }
    return toView(order);
  }

  const verdict = await verifyPayment(order);

  if (verdict.kind === "waiting") {
    return toView(order);
  }
  if (verdict.kind === "confirming") {
    return { ...toView(order), confirmations: verdict.confirmations };
  }
  if (verdict.kind === "failed") {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED", note: verdict.note },
    });
    return toView(updated);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", paidAt: new Date() },
  });
  return toView(updated);
}
