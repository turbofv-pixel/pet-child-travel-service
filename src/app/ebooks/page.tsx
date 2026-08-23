import Link from "next/link";
import { ebookCategories, sampleEbooks } from "@/data/ebooks.sample";

/** 카테고리별 이번 주 전자책 (같은 카테고리에 여러 권이 생기면 최신 주차만 노출) */
function latestEbookByCategory(categoryId: string) {
  return sampleEbooks
    .filter((ebook) => ebook.categoryId === categoryId)
    .sort((a, b) => b.week.localeCompare(a.week))[0];
}

export default function EbooksPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <section className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-black/[.06] px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
            📚 전자책
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-4xl">
            육아·여행 이야기를 매주 새로운 전자책으로
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            카테고리별로 매주 새로운 전자책을 발행해요. 짧은 에세이부터 여행
            이야기까지, 한 편씩 편하게 읽어보세요.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          {ebookCategories.map((category) => {
            const ebook = latestEbookByCategory(category.id);
            return (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                    {category.name}
                  </h2>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {category.description}
                  </p>
                </div>

                {ebook ? (
                  <Link
                    href={`/ebooks/${ebook.id}`}
                    className="flex shrink-0 items-center gap-3 rounded-xl border border-black/[.08] bg-zinc-50 p-4 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:hover:bg-white/[.08]"
                  >
                    <span className="text-3xl">{ebook.coverEmoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        이번 주 전자책 · {ebook.week}
                      </span>
                      <span className="font-medium text-black dark:text-zinc-50">
                        {ebook.title}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    아직 발행된 전자책이 없어요.
                  </span>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
