"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/supabase/use-user";

/** 우측 상단 로그인 상태 표시 - 로그인 안 됐으면 로그인 링크, 됐으면 이메일+로그아웃. */
export function AuthStatus() {
  const router = useRouter();
  const { user, loading, configured } = useSupabaseUser();

  if (!configured) return null;
  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[.06] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]"
      >
        👤 로그인
      </Link>
    );
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[.06] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]"
      >
        로그아웃
      </button>
    </div>
  );
}
