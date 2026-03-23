import type { Post, PostMeta, CreatePostInput, UpdatePostInput } from "@/lib/types";

/**
 * 博文存储抽象层，便于后续扩展为数据库等
 */
export interface IPostRepository {
  getAll(): Promise<PostMeta[]>;
  getBySlug(slug: string): Promise<Post | null>;
  create(input: CreatePostInput): Promise<Post>;
  update(slug: string, input: UpdatePostInput): Promise<Post | null>;
  delete(slug: string): Promise<boolean>;
  exists(slug: string): Promise<boolean>;
}
