"use server";

import { notFound, redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { adminSignIn, adminSignOut } from "@/admin-auth";
import { requireAdmin } from "@/lib/admin";
import { MAX_IMAGES, validateImageFiles } from "@/lib/images";
import { parsePrice } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_DOWNLOAD_FILES,
  MAX_NAME_LENGTH,
  type ProductFormState,
} from "@/lib/products";
import { deleteDownloadFiles, deleteImages, uploadDownloadFile, uploadImageFiles } from "@/lib/s3";

export async function login(_state: string | null, formData: FormData) {
  try {
    await adminSignIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw error;
  }

  return null;
}

export async function logout() {
  await adminSignOut({ redirectTo: "/admin/login" });
}

function formError(error: string, formData: FormData): ProductFormState {
  return {
    error,
    values: {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: String(formData.get("price") ?? ""),
    },
  };
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name === "" || name.length > MAX_NAME_LENGTH) {
    return `Enter a name up to ${MAX_NAME_LENGTH} characters.`;
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description === "" || description.length > MAX_DESCRIPTION_LENGTH) {
    return `Enter a description up to ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const price = parsePrice(String(formData.get("price") ?? ""));
  if (price === null) {
    return "Enter a valid price greater than 0.";
  }

  const files: File[] = [];
  for (const entry of formData.getAll("images")) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  const imageError = validateImageFiles(files);
  if (imageError) {
    return imageError;
  }

  const downloadFiles: File[] = [];
  for (const entry of formData.getAll("downloads")) {
    if (entry instanceof File && entry.size > 0) {
      downloadFiles.push(entry);
    }
  }

  if (downloadFiles.length > MAX_DOWNLOAD_FILES) {
    return `Upload at most ${MAX_DOWNLOAD_FILES} downloadable files.`;
  }

  return { name, description, price, files, downloadFiles };
}

export async function createProduct(_state: ProductFormState, formData: FormData) {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") {
    return formError(parsed, formData);
  }

  const { name, description, price, files, downloadFiles } = parsed;
  if (files.length === 0 || files.length > MAX_IMAGES) {
    return formError(`Upload between 1 and ${MAX_IMAGES} images.`, formData);
  }

  const images = await uploadImageFiles(files, "products");
  const downloadKeys = await Promise.all(downloadFiles.map(uploadDownloadFile));

  await prisma.product.create({
    data: {
      name,
      description,
      price,
      images,
      files: {
        create: downloadFiles.map((file, index) => ({
          key: downloadKeys[index],
          filename: file.name,
          size: file.size,
        })),
      },
    },
  });

  redirect("/admin");
}

export async function updateProduct(
  id: string,
  _state: ProductFormState,
  formData: FormData,
) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!product) {
    notFound();
  }

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") {
    return formError(parsed, formData);
  }

  const { name, description, price, files, downloadFiles } = parsed;

  const toRemove = new Set(formData.getAll("removeImages").map(String));
  const kept: string[] = [];
  const removedImages: string[] = [];
  for (const key of product.images) {
    if (toRemove.has(key)) {
      removedImages.push(key);
    } else {
      kept.push(key);
    }
  }

  const total = kept.length + files.length;
  if (total === 0 || total > MAX_IMAGES) {
    return formError(`A product needs between 1 and ${MAX_IMAGES} images.`, formData);
  }

  const removeDownloadIds = new Set(formData.getAll("removeDownloads").map(String));
  const keptDownloads = product.files.filter((file) => !removeDownloadIds.has(file.id));
  const removedDownloads = product.files.filter((file) => removeDownloadIds.has(file.id));

  if (keptDownloads.length + downloadFiles.length > MAX_DOWNLOAD_FILES) {
    return formError(`Upload at most ${MAX_DOWNLOAD_FILES} downloadable files.`, formData);
  }

  const added = await uploadImageFiles(files, "products");
  const addedDownloadKeys = await Promise.all(downloadFiles.map(uploadDownloadFile));

  await prisma.$transaction([
    prisma.productFile.deleteMany({
      where: { id: { in: removedDownloads.map((file) => file.id) } },
    }),
    prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        images: [...kept, ...added],
        files: {
          create: downloadFiles.map((file, index) => ({
            key: addedDownloadKeys[index],
            filename: file.name,
            size: file.size,
          })),
        },
      },
    }),
  ]);

  await deleteImages(removedImages);
  await deleteDownloadFiles(removedDownloads.map((file) => file.key));

  redirect("/admin");
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { files: true },
  });
  if (product) {
    await prisma.product.delete({ where: { id } });
    await deleteImages(product.images);
    await deleteDownloadFiles(product.files.map((file) => file.key));
  }

  redirect("/admin");
}
