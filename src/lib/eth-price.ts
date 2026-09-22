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
// than show a stale one.
const MAX_STALENESS_SECONDS = 2 * 60 * 60;
const CACHE_MS = 60_000;

let cache: { price: number; fetchedAt: number } | null = null;

async function fetchEthUsdPrice(): Promise<number | null> {
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

    return Number(answer) / 10 ** decimals;
  } catch (error) {
    console.error("Failed to read ETH/USD price feed", error);
    return null;
  }
}

// USD per 1 ETH, or null if the feed is unreachable or stale.
export async function getEthUsdPrice(): Promise<number | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.price;
  }

  const price = await fetchEthUsdPrice();
  if (price === null) {
    return cache?.price ?? null;
  }

  cache = { price, fetchedAt: Date.now() };
  return price;
}
