"use client";

import { useActionState } from "react";
import Image from "next/image";
import { createProduct, updateProduct } from "../../actions";
import { IMAGE_EXTENSIONS, MAX_IMAGE_BYTES, MAX_IMAGES } from "@/lib/images";
import { CURRENCY } from "@/lib/money";
import {
  formatFileSize,
  MAX_DESCRIPTION_LENGTH,
  MAX_DOWNLOAD_FILES,
  MAX_NAME_LENGTH,
} from "@/lib/products";

type ProductFormProps = {
  product?: {
    id: string;
    name: string;
    description: string;
    price: string;
    images: { key: string; url: string }[];
    downloadFiles: { id: string; filename: string; size: number }[];
  };
};

export function ProductForm({ product }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    product ? updateProduct.bind(null, product.id) : createProduct,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="title text-2xl">{product ? "Edit product" : "Add product"}</h1>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={MAX_NAME_LENGTH}
          defaultValue={state?.values.name ?? product?.name}
          className="field"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          maxLength={MAX_DESCRIPTION_LENGTH}
          defaultValue={state?.values.description ?? product?.description}
          className="field"
        />
      </div>

      {product && (
        <ul className="grid grid-cols-3 gap-2">
          {product.images.map((image) => (
            <li key={image.key}>
              <label className="block space-y-1 text-center text-xs">
                <Image
                  src={image.url}
                  alt=""
                  width={120}
                  height={120}
                  unoptimized
                  className="aspect-square w-full border object-cover"
                />
                <span className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    name="removeImages"
                    value={image.key}
                    className="accent-blood-bright"
                  />
                  Remove
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <label htmlFor="images" className="text-sm font-medium">
          {product ? "Add images" : "Images"}
        </label>
        <input
          id="images"
          name="images"
          type="file"
          multiple
          required={!product}
          accept={Object.keys(IMAGE_EXTENSIONS).join(",")}
          className="field"
        />
        <p className="text-xs text-muted">
          Up to {MAX_IMAGES} images{product ? " in total" : ""}, {MAX_IMAGE_BYTES / 1024 / 1024}MB
          each.
        </p>
      </div>

      {product && product.downloadFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Current downloadable files</p>
          <ul className="space-y-1">
            {product.downloadFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">
                  {file.filename}{" "}
                  <span className="text-muted">({formatFileSize(file.size)})</span>
                </span>
                <label className="flex shrink-0 items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    name="removeDownloads"
                    value={file.id}
                    className="accent-blood-bright"
                  />
                  Remove
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="downloads" className="text-sm font-medium">
          Add downloadable files
        </label>
        <input id="downloads" name="downloads" type="file" multiple className="field" />
        <p className="text-xs text-muted">
          What a paying customer receives after checkout. Up to {MAX_DOWNLOAD_FILES} files total.
          Optional — without one, the product won&apos;t show a Buy button.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price ({CURRENCY})
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={state?.values.price ?? product?.price}
          className="field"
        />
      </div>

      {state && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving..." : "Save product"}
      </button>
    </form>
  );
}
