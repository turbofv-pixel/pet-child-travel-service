"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import { isSupabaseConfigured } from "./config";

export interface UseSupabaseUserResult {
  user: User | null;
  loading: boolean;
  /** Supabase가 설정 안 된 상태(로컬 개발 초기 등)인지 */
  configured: boolean;
}

/** 현재 로그인한 Supabase 사용자를 구독합니다. 로그인 상태 변화에 자동으로 반응해요. */
export function useSupabaseUser(): UseSupabaseUserResult {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  return { user, loading, configured };
}
