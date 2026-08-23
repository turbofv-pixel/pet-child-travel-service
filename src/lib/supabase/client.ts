"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase가 설정되지 않았어요. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 " +
        ".env.local(또는 Vercel 환경변수)에 넣어주세요.",
    );
  }

  return createBrowserClient(url, anonKey);
}
