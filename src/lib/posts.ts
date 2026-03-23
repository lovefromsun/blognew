import { postRepository } from "@/lib/repositories/file-post-repository";
import type { PostMeta, Post } from "@/lib/types";

export type { PostMeta, Post };

export async function getAllPosts(): Promise<PostMeta[]> {
  return postRepository.getAll();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return postRepository.getBySlug(slug);
}
