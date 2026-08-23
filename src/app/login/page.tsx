"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "signIn" | "signUp";

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signIn") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/calendar");
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          // Supabase 프로젝트의 기본 Site URL이 localhost:3000이라 여기서
          // 명시적으로 지정하지 않으면 배포 환경에서 가입해도 확인 메일
          // 링크가 localhost로 가버립니다. (Supabase 대시보드의 Redirect
          // URLs 허용 목록에도 이 도메인이 등록돼 있어야 실제로 반영돼요.)
          options: { emailRedirectTo: `${window.location.origin}/login` },
        });
        if (signUpError) throw signUpError;
        setMessage("가입 확인 이메일을 보냈어요. 메일함(스팸함도)을 확인해주세요.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인/가입 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16 sm:px-10">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">로그인</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            아직 Supabase가 연결되지 않았어요. 환경변수(
            <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            ,{" "}
            <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            )가 설정되기 전까지는 여행 계획이 이 기기의 브라우저에만 저장돼요.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            {mode === "signIn" ? "로그인" : "회원가입"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            로그인하면 여행 계획·스탬프·리워드가 기기와 상관없이 계정에 저장돼요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            이메일
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            비밀번호
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          {message && (
            <p className="text-xs text-green-600 dark:text-green-400">{message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {isLoading ? "처리 중..." : mode === "signIn" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
            setError(null);
            setMessage(null);
          }}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {mode === "signIn" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </main>
    </div>
  );
}
