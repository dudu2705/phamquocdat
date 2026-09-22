"use client";

import { useActionState } from "react";
import { createOrder } from "@/app/orders/actions";

export function BuyButton({ productId }: { productId: string }) {
  const [error, formAction, pending] = useActionState(createOrder.bind(null, productId), null);

  return (
    <form action={formAction} className="space-y-2">
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Preparing order..." : "Buy with ETH"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
