"use client";

import { approveUser, revokeUser } from "../../user-actions";

export function ApproveButton({ id, approved }: { id: string; approved: boolean }) {
  return (
    <form action={(approved ? revokeUser : approveUser).bind(null, id)}>
      <button type="submit" className={`btn text-sm ${approved ? "btn-danger" : "btn-primary"}`}>
        {approved ? "Revoke" : "Approve"}
      </button>
    </form>
  );
}
