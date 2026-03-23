import PostEditor from "../PostEditor";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        新建文章
      </h1>
      <PostEditor />
    </div>
  );
}
