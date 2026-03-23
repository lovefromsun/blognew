import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type {
  Post,
  PostMeta,
  CreatePostInput,
  UpdatePostInput,
} from "@/lib/types";
import type { IPostRepository } from "./post-repository";

const defaultPostsDirectory = path.join(process.cwd(), "content/posts");

function getPostsDirectory(): string {
  const configured = process.env.POSTS_DIR?.trim();
  if (!configured) return defaultPostsDirectory;
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function toPostMeta(slug: string, data: Record<string, unknown>): PostMeta {
  return {
    slug,
    title: (data.title as string) || slug,
    date: (data.date as string) || "",
    excerpt: data.excerpt as string | undefined,
    author: data.author as string | undefined,
  };
}

export class FilePostRepository implements IPostRepository {
  private async ensureDir() {
    const postsDirectory = getPostsDirectory();
    await fs.mkdir(postsDirectory, { recursive: true });
  }

  async getAll(): Promise<PostMeta[]> {
    const postsDirectory = getPostsDirectory();
    let files: string[];
    try {
      files = await fs.readdir(postsDirectory);
    } catch {
      return [];
    }
    const posts: PostMeta[] = [];
    for (const name of files) {
      if (!name.endsWith(".md")) continue;
      const slug = name.replace(/\.md$/, "");
      const post = await this.getBySlug(slug);
      if (post) posts.push(post);
    }
    return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  async getBySlug(slug: string): Promise<Post | null> {
    const postsDirectory = getPostsDirectory();
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
    const fullPath = path.join(postsDirectory, `${safeSlug}.md`);
    try {
      const content = await fs.readFile(fullPath, "utf8");
      const { data, content: body } = matter(content);
      return {
        ...toPostMeta(safeSlug, data),
        content: body,
      };
    } catch {
      return null;
    }
  }

  async create(input: CreatePostInput): Promise<Post> {
    await this.ensureDir();
    const slug = input.slug.replace(/[^a-zA-Z0-9-_]/g, "") || "untitled";
    const exists = await this.exists(slug);
    if (exists) {
      throw new Error(`文章 slug "${slug}" 已存在`);
    }
    const frontmatter = matter.stringify(input.content, {
      title: input.title,
      date: input.date,
      excerpt: input.excerpt,
      author: input.author,
    });
    const postsDirectory = getPostsDirectory();
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    await fs.writeFile(fullPath, frontmatter, "utf8");
    return this.getBySlug(slug) as Promise<Post>;
  }

  async update(slug: string, input: UpdatePostInput): Promise<Post | null> {
    const existing = await this.getBySlug(slug);
    if (!existing) return null;

    const merged = {
      title: input.title ?? existing.title,
      date: input.date ?? existing.date,
      excerpt: input.excerpt ?? existing.excerpt,
      author: input.author ?? existing.author,
      content: input.content ?? existing.content,
    };

    const frontmatter = matter.stringify(merged.content, {
      title: merged.title,
      date: merged.date,
      excerpt: merged.excerpt,
      author: merged.author,
    });

    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
    const postsDirectory = getPostsDirectory();
    const fullPath = path.join(postsDirectory, `${safeSlug}.md`);
    await fs.writeFile(fullPath, frontmatter, "utf8");
    return this.getBySlug(safeSlug);
  }

  async delete(slug: string): Promise<boolean> {
    const postsDirectory = getPostsDirectory();
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
    const fullPath = path.join(postsDirectory, `${safeSlug}.md`);
    try {
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(slug: string): Promise<boolean> {
    const postsDirectory = getPostsDirectory();
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
    const fullPath = path.join(postsDirectory, `${safeSlug}.md`);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export const postRepository = new FilePostRepository();
