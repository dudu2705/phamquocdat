import type { EthUsdRate } from "@/lib/eth-price";

// How long a quoted ETH amount is honored before the order needs re-quoting.
export const ORDER_VALIDITY_MINUTES = 15;

// Blocks to wait after a payment is mined before treating it as final.
// Base blocks land every ~2s, so this costs ~10s of extra waiting.
export const REQUIRED_CONFIRMATIONS = 5;

// How long a generated download link stays valid.
export const DOWNLOAD_URL_TTL_SECONDS = 300;

const WEI_PER_ETH = BigInt(10) ** BigInt(18);

// Converts a USD price (integer cents) to wei using the raw Chainlink
// integers, rounded up. Avoids floating point entirely so the locked amount
// can't drift from what the exchange rate actually implies.
export function usdCentsToWei(usdCents: number, rate: EthUsdRate): bigint {
  const numerator =
    BigInt(usdCents) * WEI_PER_ETH * BigInt(10) ** BigInt(rate.decimals);
  const denominator = BigInt(100) * rate.answer;
  return (numerator + denominator - BigInt(1)) / denominator;
}

export function weiToEth(wei: bigint): number {
  return Number(wei) / Number(WEI_PER_ETH);
}

// The order id is carried in the transaction's data field so a payment can
// only ever satisfy the one order it was made for.
export function encodeOrderId(orderId: string): `0x${string}` {
  return `0x${Buffer.from(orderId, "utf8").toString("hex")}`;
}

export function decodeOrderData(data: string): string {
  try {
    return Buffer.from(data.replace(/^0x/, ""), "hex").toString("utf8");
  } catch {
    return "";
  }
}
