import type { CompanionType, Spot, TravelPlan } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import * as localRepo from "@/lib/storage/travel-plans";

/**
 * 여행 계획 저장소. Supabase가 설정돼 있으면 DB(로그인 필요)를, 아니면
 * 이 기기의 localStorage를 씁니다 - 호출부는 어느 쪽인지 신경 쓸 필요 없이
 * 항상 이 모듈만 씁니다.
 */

export interface CreateTravelPlanInput {
  title: string;
  companionType: CompanionType;
  startDate: string;
  endDate: string;
  spots: Spot[];
}

interface TravelPlanRow {
  id: string;
  title: string;
  companion_type: CompanionType;
  start_date: string;
  end_date: string;
  spots: Spot[];
  companion_user_ids: string[];
}

function rowToTravelPlan(row: TravelPlanRow): TravelPlan {
  return {
    id: row.id,
    title: row.title,
    companionType: row.companion_type,
    startDate: row.start_date,
    endDate: row.end_date,
    spots: row.spots,
    companionUserIds: row.companion_user_ids,
  };
}

export async function listTravelPlans(): Promise<TravelPlan[]> {
  if (!isSupabaseConfigured()) return localRepo.listTravelPlans();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TravelPlanRow[]).map(rowToTravelPlan);
}

export async function getTravelPlan(id: string): Promise<TravelPlan | undefined> {
  if (!isSupabaseConfigured()) return localRepo.getTravelPlan(id);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTravelPlan(data as TravelPlanRow) : undefined;
}

export async function createTravelPlan(input: CreateTravelPlanInput): Promise<TravelPlan> {
  if (!isSupabaseConfigured()) return localRepo.createTravelPlan(input);

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("로그인이 필요해요.");
  }

  const { data, error } = await supabase
    .from("travel_plans")
    .insert({
      user_id: userData.user.id,
      title: input.title,
      companion_type: input.companionType,
      start_date: input.startDate,
      end_date: input.endDate,
      spots: input.spots,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToTravelPlan(data as TravelPlanRow);
}

export async function deleteTravelPlan(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return localRepo.deleteTravelPlan(id);

  const supabase = createClient();
  const { error } = await supabase.from("travel_plans").delete().eq("id", id);
  if (error) throw error;
}
