import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const chainName = process.env.CHAIN === "base" ? "base" : "base-sepolia";

export const activeChain = chainName === "base" ? base : baseSepolia;

const rpcUrl =
  chainName === "base"
    ? process.env.BASE_RPC_URL
    : process.env.BASE_SEPOLIA_RPC_URL;

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(rpcUrl),
});

// Chainlink's "Standard Proxy" ETH/USD feed for the active chain.
// https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
export const ETH_USD_FEED =
  chainName === "base"
    ? "0x50015f8b17fb2C290Dde41fDc246ed0dcEE93a8b"
    : "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
