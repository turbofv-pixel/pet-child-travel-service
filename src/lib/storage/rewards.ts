import type { Reward } from "@/types";
import { generateId, readList, writeList } from "./local-store";

const STORAGE_KEY = "pet-child-travel:rewards";

export function listRewards(travelPlanId: string): Reward[] {
  return readList<Reward>(STORAGE_KEY).filter(
    (reward) => reward.travelPlanId === travelPlanId,
  );
}

/** 여행 계획 하나당 리워드 1개만 지급합니다 (이미 있으면 기존 걸 반환, 멱등). */
export function claimReward(
  travelPlanId: string,
  title: string,
  description: string,
): Reward {
  const all = readList<Reward>(STORAGE_KEY);
  const existing = all.find((reward) => reward.travelPlanId === travelPlanId);
  if (existing) return existing;

  const reward: Reward = {
    id: generateId("reward"),
    travelPlanId,
    title,
    description,
    claimedAt: new Date().toISOString(),
  };
  all.push(reward);
  writeList(STORAGE_KEY, all);

  return reward;
}
