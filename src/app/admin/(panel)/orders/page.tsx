import { activeChain } from "@/lib/chain";
import { requireAdmin } from "@/lib/admin";
import { formatEth, formatPrice } from "@/lib/money";
import { weiToEth } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { MarkPaidButton } from "./mark-paid-button";

const STATUS_COLOR: Record<string, string> = {
  PAID: "text-gold",
  PENDING: "text-muted",
  EXPIRED: "text-muted",
  FAILED: "text-danger",
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true, user: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="title text-2xl">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Tx</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-2 pr-4">{order.product.name}</td>
                  <td className="py-2 pr-4">{order.user.email}</td>
                  <td className={`py-2 pr-4 ${STATUS_COLOR[order.status] ?? ""}`}>
                    {order.status}
                    {order.note && <p className="text-xs text-muted">{order.note}</p>}
                  </td>
                  <td className="py-2 pr-4">
                    {formatPrice(order.usdPriceSnapshot)}
                    <br />
                    <span className="text-muted">
                      {formatEth(weiToEth(BigInt(order.amountWei)))}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {order.txHash ? (
                      activeChain.blockExplorers ? (
                        <a
                          href={`${activeChain.blockExplorers.default.url}/tx/${order.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          {order.txHash.slice(0, 10)}&hellip;
                        </a>
                      ) : (
                        `${order.txHash.slice(0, 10)}…`
                      )
                    ) : (
                      <span className="text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted">
                    {order.createdAt.toLocaleString()}
                  </td>
                  <td className="py-2">
                    {order.status !== "PAID" && <MarkPaidButton id={order.id} />}
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
