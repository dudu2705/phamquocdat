import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { priceInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";
import { deleteProduct } from "../../../../actions";
import { DeleteButton } from "../../../delete-button";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: priceInputValue(product.price),
          images: product.images.map((key) => ({ key, url: imageUrl(key) })),
        }}
      />
      <div className="ornament">&#9670;</div>
      <DeleteButton action={deleteProduct.bind(null, product.id)} label="Delete product" />
    </div>
  );
}
