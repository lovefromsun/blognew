export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  author?: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface CreatePostInput {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  author?: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  date?: string;
  excerpt?: string;
  author?: string;
  content?: string;
}

export interface Comment {
  id: string;
  postSlug: string;
  author: string;
  content: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface CreateCommentInput {
  postSlug: string;
  author: string;
  content: string;
  ip: string;
  status?: "pending" | "approved" | "rejected";
}
