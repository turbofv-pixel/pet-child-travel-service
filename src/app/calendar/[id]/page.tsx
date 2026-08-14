"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Reward, Spot, TravelPlan } from "@/types";
import { getTravelPlan } from "@/lib/storage/travel-plans";
import { addStamp, listStamps } from "@/lib/storage/stamps";
import { claimReward, listRewards } from "@/lib/storage/rewards";
import { haversineDistanceKm } from "@/lib/geo";
import { SpotActionLinks } from "@/components/SpotActionLinks";

/** 이 정도 거리 이내면 "도착"으로 인정해서 스탬프를 찍어줍니다. */
const CHECK_IN_RADIUS_KM = 0.5;

const COMPANION_LABEL: Record<TravelPlan["companionType"], string> = {
  pet: "🐾 반려동물과",
  child: "🧒 아이와",
};

type CheckInState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "too-far"; distanceKm: number }
  | { status: "error"; message: string };

export default function TravelPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;

  const [plan, setPlan] = useState<TravelPlan | null | undefined>(undefined);
  const [stampedSpotIds, setStampedSpotIds] = useState<Set<string>>(new Set());
  const [reward, setReward] = useState<Reward | null>(null);
  const [checkInStates, setCheckInStates] = useState<Record<string, CheckInState>>({});

  useEffect(() => {
    // localStorage는 서버에 없는 외부 저장소라 마운트 후(클라이언트에서만)
    // 읽어와야 SSR과 하이드레이션 결과가 어긋나지 않습니다.
    const loaded = getTravelPlan(planId) ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(loaded);
    if (loaded) {
      refreshStamps(loaded);
    }
  }, [planId]);

  function refreshStamps(currentPlan: TravelPlan) {
    const stamps = listStamps(currentPlan.id);
    setStampedSpotIds(new Set(stamps.map((s) => s.spotId)));

    if (stamps.length === currentPlan.spots.length && currentPlan.spots.length > 0) {
      const claimed = claimReward(
        currentPlan.id,
        "🎉 여행 계획 완주 리워드",
        `"${currentPlan.title}"의 모든 여행지를 다녀왔어요!`,
      );
      setReward(claimed);
    } else {
      const existing = listRewards(currentPlan.id)[0] ?? null;
      setReward(existing);
    }
  }

  function handleCheckIn(spot: Spot) {
    if (!plan) return;
    if (!("geolocation" in navigator)) {
      setCheckInStates((prev) => ({
        ...prev,
        [spot.id]: { status: "error", message: "이 브라우저는 위치 확인을 지원하지 않아요." },
      }));
      return;
    }

    setCheckInStates((prev) => ({ ...prev, [spot.id]: { status: "checking" } }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distanceKm = haversineDistanceKm(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          spot.location,
        );

        if (distanceKm <= CHECK_IN_RADIUS_KM) {
          addStamp(plan.id, spot.id);
          setCheckInStates((prev) => ({ ...prev, [spot.id]: { status: "idle" } }));
          refreshStamps(plan);
        } else {
          setCheckInStates((prev) => ({
            ...prev,
            [spot.id]: { status: "too-far", distanceKm },
          }));
        }
      },
      (geoError) => {
        setCheckInStates((prev) => ({
          ...prev,
          [spot.id]: {
            status: "error",
            message: `위치를 가져오지 못했어요 (${geoError.message}). 위치 권한을 허용해주세요.`,
          },
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (plan === undefined) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
          <p className="text-zinc-600 dark:text-zinc-400">불러오는 중...</p>
        </main>
      </div>
    );
  }

  if (plan === null) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 sm:px-10">
          <p className="text-zinc-600 dark:text-zinc-400">
            여행 계획을 찾을 수 없어요. 이 기기의 브라우저에만 저장되기 때문에,
            다른 기기/브라우저에서는 보이지 않을 수 있어요.
          </p>
          <Link href="/calendar" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← 캘린더로 돌아가기
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <Link href="/calendar" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← 캘린더로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            {plan.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {COMPANION_LABEL[plan.companionType]} · {plan.startDate} ~ {plan.endDate}
          </p>
        </div>

        <div className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            🏅 스탬프 {stampedSpotIds.size} / {plan.spots.length}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{
                width: `${plan.spots.length === 0 ? 0 : (stampedSpotIds.size / plan.spots.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {reward && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="font-medium text-amber-800 dark:text-amber-300">{reward.title}</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">{reward.description}</p>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {plan.spots.map((spot) => {
            const stamped = stampedSpotIds.has(spot.id);
            const checkInState = checkInStates[spot.id] ?? { status: "idle" };

            return (
              <li
                key={spot.id}
                className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-black dark:text-zinc-50">
                    {stamped ? "✅ " : ""}
                    {spot.name}
                  </span>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {spot.address}
                </span>
                <SpotActionLinks spot={spot} />
                {!stamped && (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(spot)}
                    disabled={checkInState.status === "checking"}
                    className="mt-1 w-fit rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
                  >
                    {checkInState.status === "checking" ? "위치 확인 중..." : "📍 체크인"}
                  </button>
                )}
                {checkInState.status === "too-far" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    아직 여행지 근처가 아니에요 (약 {checkInState.distanceKm.toFixed(2)}km
                    떨어짐 · {CHECK_IN_RADIUS_KM}km 이내에서 체크인할 수 있어요)
                  </p>
                )}
                {checkInState.status === "error" && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {checkInState.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
