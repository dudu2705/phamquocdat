import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { getEthUsdPrice } from "@/lib/eth-price";
import { formatEth, formatPrice, usdToEth } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function ProductsPage() {
  await connection();
  const [products, ethUsdPrice] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    getEthUsdPrice(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <Link href="/" className="link inline-block text-sm text-muted">
        Home
      </Link>

      <h1 className="title text-3xl">Products</h1>
      <div className="ornament">&#9670;</div>

      {products.length === 0 ? (
        <p className="text-muted">No products yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="card block space-y-2 hover:border-gold hover:shadow-[0_0_28px_rgb(143_29_29/0.4)]"
              >
                <Image
                  src={imageUrl(product.images[0])}
                  alt={product.name}
                  width={400}
                  height={400}
                  unoptimized
                  className="aspect-square w-full object-cover"
                />
                <p className="truncate text-bone">{product.name}</p>
                <p className="text-gold">{formatPrice(product.price)}</p>
                {ethUsdPrice && (
                  <p className="text-sm text-muted">
                    &#8776; {formatEth(usdToEth(product.price, ethUsdPrice))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
