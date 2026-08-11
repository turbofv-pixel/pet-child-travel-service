import type { CompanionType, Spot, TravelPlan } from "@/types";
import { generateId, readList, writeList } from "./local-store";

const STORAGE_KEY = "pet-child-travel:travel-plans";

export function listTravelPlans(): TravelPlan[] {
  return readList<TravelPlan>(STORAGE_KEY);
}

export function getTravelPlan(id: string): TravelPlan | undefined {
  return listTravelPlans().find((plan) => plan.id === id);
}

export interface CreateTravelPlanInput {
  title: string;
  companionType: CompanionType;
  startDate: string;
  endDate: string;
  spots: Spot[];
}

export function createTravelPlan(input: CreateTravelPlanInput): TravelPlan {
  const plan: TravelPlan = {
    id: generateId("plan"),
    title: input.title,
    companionType: input.companionType,
    startDate: input.startDate,
    endDate: input.endDate,
    spots: input.spots,
    companionUserIds: [],
  };

  const plans = listTravelPlans();
  plans.unshift(plan);
  writeList(STORAGE_KEY, plans);

  return plan;
}

export function deleteTravelPlan(id: string): void {
  writeList(
    STORAGE_KEY,
    listTravelPlans().filter((plan) => plan.id !== id),
  );
}
