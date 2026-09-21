import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title text-2xl">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-muted">No products yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="card space-y-2">
              <Image
                src={imageUrl(product.images[0])}
                alt={product.name}
                width={400}
                height={400}
                unoptimized
                className="aspect-square w-full object-cover"
              />
              <p className="truncate text-bone">{product.name}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gold">{formatPrice(product.price)}</span>
                <span className="text-muted">
                  {product.images.length} {product.images.length === 1 ? "image" : "images"}
                </span>
              </div>
              <Link href={`/admin/products/${product.id}/edit`} className="btn w-full">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
