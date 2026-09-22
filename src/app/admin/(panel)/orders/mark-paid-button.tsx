"use client";

import { forcePaidOrder } from "../../order-actions";

export function MarkPaidButton({ id }: { id: string }) {
  return (
    <form
      action={forcePaidOrder.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm("Mark this order as paid without re-checking the chain?")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn text-sm">
        Mark as paid
      </button>
    </form>
  );
}
