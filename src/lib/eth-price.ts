import { ETH_USD_FEED, publicClient } from "@/lib/chain";

// Minimal AggregatorV3Interface, the standard Chainlink feed ABI.
const AGGREGATOR_ABI = [
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "latestRoundData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

// Generous bound: if the feed hasn't updated in this long, something is
// wrong upstream (RPC, feed, or chain) and we'd rather hide the ETH price
// than show or charge a stale one.
const MAX_STALENESS_SECONDS = 2 * 60 * 60;
const CACHE_MS = 60_000;

// The raw on-chain values, kept alongside the convenience float so order
// amounts can be computed in exact integer math instead of floats.
export type EthUsdRate = {
  usdPerEth: number;
  answer: bigint;
  decimals: number;
};

let cache: { rate: EthUsdRate; fetchedAt: number } | null = null;

async function fetchEthUsdRate(): Promise<EthUsdRate | null> {
  try {
    const [decimals, round] = await Promise.all([
      publicClient.readContract({
        address: ETH_USD_FEED,
        abi: AGGREGATOR_ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: ETH_USD_FEED,
        abi: AGGREGATOR_ABI,
        functionName: "latestRoundData",
      }),
    ]);

    const [roundId, answer, , updatedAt, answeredInRound] = round;

    if (answer <= BigInt(0) || answeredInRound < roundId) {
      return null;
    }

    const ageSeconds = Date.now() / 1000 - Number(updatedAt);
    if (ageSeconds > MAX_STALENESS_SECONDS) {
      return null;
    }

    return { usdPerEth: Number(answer) / 10 ** decimals, answer, decimals };
  } catch (error) {
    console.error("Failed to read ETH/USD price feed", error);
    return null;
  }
}

// The full rate, or null if the feed is unreachable or stale. Used wherever
// an exact conversion is needed (locking an order's ETH amount).
export async function getEthUsdRate(): Promise<EthUsdRate | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.rate;
  }

  const rate = await fetchEthUsdRate();
  if (rate === null) {
    return cache?.rate ?? null;
  }

  cache = { rate, fetchedAt: Date.now() };
  return rate;
}

// USD per 1 ETH, or null if the feed is unreachable or stale. Used for
// display only, where float precision is fine.
export async function getEthUsdPrice(): Promise<number | null> {
  const rate = await getEthUsdRate();
  return rate?.usdPerEth ?? null;
}
