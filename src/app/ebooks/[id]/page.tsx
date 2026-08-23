import Link from "next/link";
import { notFound } from "next/navigation";
import { ebookCategories, sampleEbooks } from "@/data/ebooks.sample";

export default async function EbookDetailPage({
  params,
}: PageProps<"/ebooks/[id]">) {
  const { id } = await params;
  const ebook = sampleEbooks.find((item) => item.id === id);

  if (!ebook) {
    notFound();
  }

  const category = ebookCategories.find((item) => item.id === ebook.categoryId);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <Link
          href="/ebooks"
          className="w-fit text-sm font-medium text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← 전자책 목록으로
        </Link>

        <header className="flex flex-col gap-4">
          {category && (
            <span className="w-fit rounded-full bg-black/[.06] px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
              {category.name}
            </span>
          )}
          <div className="flex items-center gap-4">
            <span className="text-5xl">{ebook.coverEmoji}</span>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-3xl">
                {ebook.title}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {ebook.author} · {ebook.week}
              </p>
            </div>
          </div>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            {ebook.summary}
          </p>
        </header>

        <article className="flex flex-col gap-12">
          {ebook.chapters.map((chapter) => (
            <section key={chapter.title} className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                {chapter.title}
              </h2>
              <div className="flex flex-col gap-4">
                {chapter.body.split("\n\n").map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-base leading-8 text-zinc-700 dark:text-zinc-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
