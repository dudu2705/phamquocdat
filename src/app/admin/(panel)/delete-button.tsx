"use client";

export function DeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm("Delete this item and its images? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-danger w-full">
        {label}
      </button>
    </form>
  );
}
