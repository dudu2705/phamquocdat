export const MAX_NAME_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 2000;

export type ProductFormState = {
  error: string;
  values: { name: string; description: string; price: string };
} | null;
