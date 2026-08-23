import type { Reward } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import * as localRepo from "@/lib/storage/rewards";

interface RewardRow {
  id: string;
  travel_plan_id: string;
  title: string;
  description: string;
  claimed_at: string | null;
}

function rowToReward(row: RewardRow): Reward {
  return {
    id: row.id,
    travelPlanId: row.travel_plan_id,
    title: row.title,
    description: row.description,
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
      { travel_plan_id: travelPlanId, title, description },
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
