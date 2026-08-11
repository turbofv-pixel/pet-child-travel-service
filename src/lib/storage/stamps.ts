import type { Stamp } from "@/types";
import { generateId, readList, writeList } from "./local-store";

const STORAGE_KEY = "pet-child-travel:stamps";

export function listStamps(travelPlanId: string): Stamp[] {
  return readList<Stamp>(STORAGE_KEY).filter(
    (stamp) => stamp.travelPlanId === travelPlanId,
  );
}

export function hasStamp(travelPlanId: string, spotId: string): boolean {
  return listStamps(travelPlanId).some((stamp) => stamp.spotId === spotId);
}

/** 이미 스탬프가 있으면 새로 만들지 않고 기존 것을 돌려줍니다 (멱등). */
export function addStamp(travelPlanId: string, spotId: string): Stamp {
  const all = readList<Stamp>(STORAGE_KEY);
  const existing = all.find(
    (stamp) => stamp.travelPlanId === travelPlanId && stamp.spotId === spotId,
  );
  if (existing) return existing;

  const stamp: Stamp = {
    id: generateId("stamp"),
    spotId,
    travelPlanId,
    earnedAt: new Date().toISOString(),
  };
  all.push(stamp);
  writeList(STORAGE_KEY, all);

  return stamp;
}
