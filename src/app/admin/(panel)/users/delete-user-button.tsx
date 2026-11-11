"use client";

import { deleteUser } from "../../user-actions";

export function DeleteUserButton({ id, email, orderCount }: { id: string; email: string; orderCount: number }) {
  if (orderCount > 0) {
    return (
      <span className="text-muted text-sm" title="Users with order history cannot be deleted.">
        {orderCount} order{orderCount === 1 ? "" : "s"}
      </span>
    );
  }

  return (
    <form
      action={deleteUser.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`Delete ${email}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-danger text-sm">
        Delete
      </button>
    </form>
  );
}
