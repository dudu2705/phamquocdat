import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEthUsdPrice } from "@/lib/eth-price";
import { formatEth, formatPrice, usdToEth } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  await connection();
  const { id } = await params;

  const [product, ethUsdPrice] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getEthUsdPrice(),
  ]);
  if (!product) {
    notFound();
  }

  const [mainImage, ...otherImages] = product.images;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <Link href="/products" className="link inline-block text-sm text-muted">
        All products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Image
            src={imageUrl(mainImage)}
            alt={product.name}
            width={800}
            height={800}
            unoptimized
            className="aspect-square w-full border object-cover"
          />
          {otherImages.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {otherImages.map((key) => (
                <li key={key}>
                  <Image
                    src={imageUrl(key)}
                    alt={product.name}
                    width={200}
                    height={200}
                    unoptimized
                    className="aspect-square w-full border object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="title text-3xl">{product.name}</h1>
          <div className="ornament">&#9670;</div>
          <p className="text-2xl text-gold">
            {formatPrice(product.price)}
            {ethUsdPrice && (
              <span className="ml-2 text-lg text-muted">
                &#8776; {formatEth(usdToEth(product.price, ethUsdPrice))}
              </span>
            )}
          </p>
          <p className="whitespace-pre-line text-lg leading-relaxed">{product.description}</p>
        </div>
      </div>
    </main>
  );
}
