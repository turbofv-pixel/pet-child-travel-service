import type { Stamp } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import * as localRepo from "@/lib/storage/stamps";

interface StampRow {
  id: string;
  travel_plan_id: string;
  spot_id: string;
  earned_at: string;
}

function rowToStamp(row: StampRow): Stamp {
  return {
    id: row.id,
    travelPlanId: row.travel_plan_id,
    spotId: row.spot_id,
    earnedAt: row.earned_at,
  };
}

export async function listStamps(travelPlanId: string): Promise<Stamp[]> {
  if (!isSupabaseConfigured()) return localRepo.listStamps(travelPlanId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stamps")
    .select("*")
    .eq("travel_plan_id", travelPlanId);

  if (error) throw error;
  return (data as StampRow[]).map(rowToStamp);
}

/** 이미 스탬프가 있으면 새로 만들지 않고 기존 것을 돌려줍니다 (멱등). */
export async function addStamp(travelPlanId: string, spotId: string): Promise<Stamp> {
  if (!isSupabaseConfigured()) return localRepo.addStamp(travelPlanId, spotId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stamps")
    .upsert(
      { travel_plan_id: travelPlanId, spot_id: spotId },
      { onConflict: "travel_plan_id,spot_id", ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw error;
  return rowToStamp(data as StampRow);
}
