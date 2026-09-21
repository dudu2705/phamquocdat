export const MAX_TITLE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 100;
export const MAX_CONTENT_LENGTH = 20000;

export type ArticleFormState = {
  error: string;
  values: { title: string; author: string; content: string };
} | null;
