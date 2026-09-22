import type { Order } from "@/generated/prisma/client";
import { publicClient } from "@/lib/chain";
import { decodeOrderData, REQUIRED_CONFIRMATIONS } from "@/lib/orders";

const RECEIVE_ADDRESS = (process.env.RECEIVE_ADDRESS ?? "").toLowerCase();

export type PaymentVerdict =
  | { kind: "waiting" }
  | { kind: "confirming"; confirmations: number }
  | { kind: "failed"; note: string }
  | { kind: "paid" };

// Re-checks a payment against the chain from scratch every time it's called.
// Nothing here is trusted from the browser except which transaction hash to
// look up — every requirement (destination, amount, order reference, timing,
// confirmations) is re-derived from the chain itself.
export async function verifyPayment(order: Order): Promise<PaymentVerdict> {
  const txHash = order.txHash as `0x${string}` | null;
  if (!txHash) {
    return { kind: "waiting" };
  }

  let tx;
  try {
    tx = await publicClient.getTransaction({ hash: txHash });
  } catch {
    return { kind: "waiting" };
  }

  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  } catch {
    return { kind: "waiting" };
  }

  if (receipt.status !== "success") {
    return { kind: "failed", note: "The transaction reverted on-chain." };
  }

  if (!tx.to || tx.to.toLowerCase() !== RECEIVE_ADDRESS) {
    return { kind: "failed", note: "The payment was not sent to the store address." };
  }

  if (tx.value < BigInt(order.amountWei)) {
    return { kind: "failed", note: "The amount sent was less than the quoted price." };
  }

  if (decodeOrderData(tx.input) !== order.id) {
    return { kind: "failed", note: "The payment's order reference did not match this order." };
  }

  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
  if (Number(block.timestamp) * 1000 > order.expiresAt.getTime()) {
    return { kind: "failed", note: "The payment was mined after the quote had expired." };
  }

  const latestBlock = await publicClient.getBlockNumber();
  const confirmations = Number(latestBlock - receipt.blockNumber) + 1;

  if (confirmations < REQUIRED_CONFIRMATIONS) {
    return { kind: "confirming", confirmations };
  }

  return { kind: "paid" };
}
