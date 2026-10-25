import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ApproveButton } from "./approve-button";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="title text-2xl">Users</h1>

      {users.length === 0 ? (
        <p className="text-muted">No registrations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Registered</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2 pr-4">{user.name ?? <span className="text-muted">&mdash;</span>}</td>
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">
                    {user.approved ? (
                      <span className="text-gold">Approved</span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted">{user.createdAt.toLocaleString()}</td>
                  <td className="py-2">
                    <ApproveButton id={user.id} approved={user.approved} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
