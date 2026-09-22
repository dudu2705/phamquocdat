import Link from "next/link";
import { notFound } from "next/navigation";
import { activeChain } from "@/lib/chain";
import { requireUser } from "@/lib/customer";
import { formatPrice } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { PayPanel } from "./pay-panel";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!order || order.userId !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-lg space-y-6 p-8">
      <Link href={`/products/${order.productId}`} className="link inline-block text-sm text-muted">
        Back to {order.product.name}
      </Link>

      <h1 className="title text-3xl">Checkout</h1>
      <div className="ornament">&#9670;</div>

      <p className="text-lg">
        {order.product.name} &mdash; {formatPrice(order.usdPriceSnapshot)}
      </p>

      <PayPanel
        order={{
          id: order.id,
          status: order.status,
          amountWei: order.amountWei,
          expiresAt: order.expiresAt.toISOString(),
          txHash: order.txHash,
          note: order.note,
          confirmations: null,
        }}
        productId={order.productId}
        receiveAddress={process.env.RECEIVE_ADDRESS ?? ""}
        chain={{
          id: activeChain.id,
          name: activeChain.name,
          currencySymbol: activeChain.nativeCurrency.symbol,
          rpcUrl: activeChain.rpcUrls.default.http[0],
          explorerUrl: activeChain.blockExplorers?.default.url,
        }}
      />
    </main>
  );
}
