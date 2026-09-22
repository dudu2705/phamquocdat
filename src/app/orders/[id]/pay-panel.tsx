"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { checkOrderStatus, submitPayment, type OrderView } from "../actions";

type Chain = {
  id: number;
  name: string;
  currencySymbol: string;
  rpcUrl: string;
  explorerUrl?: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function toHexValue(wei: string) {
  return `0x${BigInt(wei).toString(16)}`;
}

// Mirrors src/lib/orders.ts's encodeOrderId, without a Node Buffer dependency.
function toHexData(orderId: string) {
  const bytes = new TextEncoder().encode(orderId);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function formatEthAmount(wei: string) {
  const eth = Number(BigInt(wei)) / 1e18;
  return eth.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function useCountdown(expiresAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

export function PayPanel({
  order: initialOrder,
  productId,
  receiveAddress,
  chain,
}: {
  order: OrderView;
  productId: string;
  receiveAddress: string;
  chain: Chain;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const secondsLeft = useCountdown(order.expiresAt);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasWallet = typeof window !== "undefined" && Boolean(window.ethereum);
  const expired = order.status === "PENDING" && !order.txHash && secondsLeft <= 0;

  useEffect(() => {
    if (order.status === "PENDING" && order.txHash && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const next = await checkOrderStatus(order.id);
        if (next) {
          setOrder(next);
          if (next.status !== "PENDING" && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.status, order.txHash]);

  async function connect() {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet found. Install a browser wallet like MetaMask first.");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? null);
    } catch {
      setError("Wallet connection was rejected.");
    }
  }

  async function ensureChain() {
    if (!window.ethereum) return false;
    const targetHex = `0x${chain.id.toString(16)}`;
    const currentHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    if (currentHex.toLowerCase() === targetHex.toLowerCase()) {
      return true;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
      return true;
    } catch (switchError) {
      const code = (switchError as { code?: number })?.code;
      if (code !== 4902) {
        setError("Switch your wallet to the right network to continue.");
        return false;
      }
    }

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetHex,
            chainName: chain.name,
            nativeCurrency: { name: chain.currencySymbol, symbol: chain.currencySymbol, decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : [],
          },
        ],
      });
      return true;
    } catch {
      setError("Could not add the required network to your wallet.");
      return false;
    }
  }

  async function pay() {
    setError(null);
    setBusy(true);
    try {
      if (!account) {
        await connect();
      }
      if (!(await ensureChain())) {
        return;
      }
      if (!window.ethereum) {
        return;
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const from = accounts[0];

      const txHash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: receiveAddress,
            value: toHexValue(order.amountWei),
            data: toHexData(order.id),
          },
        ],
      })) as string;

      const result = await submitPayment(order.id, txHash);
      if (!result.ok) {
        setError(result.error ?? "Could not record the payment.");
        return;
      }

      setOrder({ ...order, txHash });
    } catch (payError) {
      const message = (payError as { message?: string })?.message;
      setError(message?.includes("User rejected") ? "Payment was rejected." : "Payment failed to send.");
    } finally {
      setBusy(false);
    }
  }

  if (order.status === "PAID") {
    return (
      <div className="card space-y-2">
        <p className="text-gold">Payment confirmed.</p>
        <Link href={`/products/${productId}`} className="link">
          Go to your download
        </Link>
      </div>
    );
  }

  if (order.status === "EXPIRED" || expired) {
    return (
      <div className="card space-y-2">
        <p className="text-danger">This quote has expired.</p>
        <Link href={`/products/${productId}`} className="link">
          Start a new order
        </Link>
      </div>
    );
  }

  if (order.status === "FAILED") {
    return (
      <div className="card space-y-2">
        <p className="text-danger">{order.note ?? "This payment could not be verified."}</p>
        {order.txHash && chain.explorerUrl && (
          <a
            href={`${chain.explorerUrl}/tx/${order.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="link block text-sm"
          >
            View transaction
          </a>
        )}
        <Link href={`/products/${productId}`} className="link block">
          Start a new order
        </Link>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <p className="text-2xl text-gold">{formatEthAmount(order.amountWei)} {chain.currencySymbol}</p>
      <p className="text-sm text-muted">
        Quote expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
      </p>

      {order.txHash ? (
        <div className="space-y-2">
          <p className="text-muted">
            Payment submitted
            {order.confirmations !== null
              ? ` — confirming (${order.confirmations}/5)`
              : ", waiting to be mined"}
            &hellip;
          </p>
          {chain.explorerUrl && (
            <a
              href={`${chain.explorerUrl}/tx/${order.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="link block text-sm"
            >
              View transaction
            </a>
          )}
        </div>
      ) : hasWallet ? (
        <button type="button" onClick={pay} disabled={busy} className="btn btn-primary w-full">
          {busy ? "Confirm in your wallet..." : account ? "Pay now" : "Connect wallet & pay"}
        </button>
      ) : (
        <p className="text-muted">
          No wallet found in this browser. Install a browser wallet such as MetaMask, then reload
          this page.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
