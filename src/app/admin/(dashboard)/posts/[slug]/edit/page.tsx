import { notFound } from "next/navigation";
import { postRepository } from "@/lib/repositories/file-post-repository";
import PostEditor from "../../PostEditor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await postRepository.getBySlug(slug);
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        编辑文章
      </h1>
      <PostEditor initial={post} />
    </div>
  );
}
