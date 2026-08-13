"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "🏠 홈" },
  { href: "/plan", label: "✨ 추천받기" },
  { href: "/calendar", label: "📅 캘린더" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 모든 페이지 상단에 고정으로 붙는 내비게이션.
 * 페이지마다 "뒤로가기" 링크만 있고 서로 이동할 방법이 없다는 피드백 때문에
 * (홈 ↔ 추천받기 ↔ 캘린더를 오갈 방법이 없었음) 전역으로 추가했습니다.
 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-black/[.08] bg-zinc-50/90 backdrop-blur dark:border-white/[.145] dark:bg-black/90">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-1 px-6 py-3 sm:px-10">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(pathname, item.href)
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
