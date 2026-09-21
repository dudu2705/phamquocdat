export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFiles(files: File[]) {
  for (const file of files) {
    if (!(file.type in IMAGE_EXTENSIONS)) {
      return "Only JPEG, PNG, WebP or GIF images are allowed.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `Each image must be ${MAX_IMAGE_BYTES / 1024 / 1024}MB or smaller.`;
    }
  }

  return null;
}
