import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logout } from "../actions";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="title text-lg">
            Admin
          </Link>
          <nav className="flex gap-6 font-display text-sm tracking-[0.15em] uppercase">
            <Link href="/admin" className="transition hover:text-gold">
              Products
            </Link>
            <Link href="/admin/articles" className="transition hover:text-gold">
              Articles
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">{admin.email}</span>
          <form action={logout}>
            <button type="submit" className="btn">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
