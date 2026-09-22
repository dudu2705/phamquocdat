import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, next/image can't optimize SVGs without extra config */}
      <img src="/logo.svg" alt="Site logo" className="h-64 w-auto" />

      <h1 className="title text-center text-5xl break-words">
        {session?.user ? `Hello, ${session.user.name ?? session.user.email}` : "Log in to see my stuff"}
      </h1>
      <div className="ornament w-64">&#9670;</div>

      {session?.user ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-6">
            <Link href="/articles" className="link">
              Esoteric knowledge
            </Link>
            <Link href="/products" className="link">
              Browse products
            </Link>
          </div>
          <p className="text-muted">
            Signed in as {session.user.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn">
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="btn">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Register
          </Link>
        </div>
      )}
    </main>
  );
}
