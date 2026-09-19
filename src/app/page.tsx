import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold">Hello Dat</h1>

      {session?.user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-600">
            Signed in as {session.user.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="rounded border px-3 py-2">
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="rounded border px-3 py-2">
            Log in
          </Link>
          <Link href="/register" className="rounded bg-black px-3 py-2 text-white">
            Register
          </Link>
        </div>
      )}
    </main>
  );
}
