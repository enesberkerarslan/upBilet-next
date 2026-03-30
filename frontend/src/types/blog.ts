export type BlogContentBlock = {
  text?: string;
  imageUrl?: string;
};

export type PublicBlog = {
  _id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  content?: BlogContentBlock[];
  createdAt?: string;
};
