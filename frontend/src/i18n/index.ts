import { en as enMessages } from "@/i18n/messages/en";
import { tr as trMessages } from "@/i18n/messages/tr";

export type Locale = "tr" | "en";

export type MessageTree = typeof enMessages;

const dictionaries: Record<Locale, MessageTree> = {
  tr: trMessages as unknown as MessageTree,
  en: enMessages,
};

export const defaultLocale: Locale = "tr";

export const locales: Locale[] = ["tr", "en"];

export function getMessages(locale: Locale): MessageTree {
  return dictionaries[locale] ?? dictionaries.tr;
}

export function translate(tree: MessageTree, path: string): string {
  const parts = path.split(".");
  let cur: unknown = tree;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}
