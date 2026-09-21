import type { Reward } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import * as localRepo from "@/lib/storage/rewards";
import { generateRewardCode } from "@/lib/reward-code";

interface RewardRow {
  id: string;
  travel_plan_id: string;
  title: string;
  description: string;
  code: string;
  claimed_at: string | null;
}

function rowToReward(row: RewardRow): Reward {
  return {
    id: row.id,
    travelPlanId: row.travel_plan_id,
    title: row.title,
    description: row.description,
    code: row.code,
    claimedAt: row.claimed_at ?? undefined,
  };
}

export async function listRewards(travelPlanId: string): Promise<Reward[]> {
  if (!isSupabaseConfigured()) return localRepo.listRewards(travelPlanId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("travel_plan_id", travelPlanId);

  if (error) throw error;
  return (data as RewardRow[]).map(rowToReward);
}

/** 로그인한 사용자가 지금까지 받은 모든 리워드 (/rewards 갤러리용). */
export async function listAllRewards(): Promise<Reward[]> {
  if (!isSupabaseConfigured()) return localRepo.listAllRewards();

  const supabase = createClient();
  // RLS 정책이 travel_plans.user_id = auth.uid()인 것만 걸러주기 때문에
  // 별도 필터 없이 select만 해도 본인 리워드만 돌아옵니다.
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("claimed_at", { ascending: false });

  if (error) throw error;
  return (data as RewardRow[]).map(rowToReward);
}

/** 여행 계획 하나당 리워드 1개만 지급합니다 (이미 있으면 기존 걸 반환, 멱등). */
export async function claimReward(
  travelPlanId: string,
  title: string,
  description: string,
): Promise<Reward> {
  if (!isSupabaseConfigured()) return localRepo.claimReward(travelPlanId, title, description);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("rewards")
    .upsert(
      { travel_plan_id: travelPlanId, title, description, code: generateRewardCode() },
      { onConflict: "travel_plan_id", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();

  if (error) throw error;

  if (data) return rowToReward(data as RewardRow);

  // ignoreDuplicates로 인해 이미 있던 행은 upsert 결과로 안 돌아오므로 다시 조회
  const existing = await listRewards(travelPlanId);
  return existing[0];
}
