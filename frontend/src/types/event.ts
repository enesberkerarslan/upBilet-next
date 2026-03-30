export type EventTag = { tag?: string; name?: string };

export type PublicEvent = {
  _id: string;
  slug: string;
  name: string;
  image?: string;
  date: string;
  location?: string;
  metaTitle?: string;
  tags?: EventTag[];
  isMainPage?: boolean;
};
