import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const posts = await getAllPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((p) => {
    const last =
      p.date && !Number.isNaN(new Date(p.date).getTime())
        ? new Date(p.date)
        : new Date();
    return {
      url: `${base}/blog/${p.slug}`,
      lastModified: last,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...postPages];
}
