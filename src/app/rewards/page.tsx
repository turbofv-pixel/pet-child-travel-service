"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Reward, TravelPlan } from "@/types";
import { listAllRewards } from "@/lib/data/rewards";
import { listTravelPlans } from "@/lib/data/travel-plans";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAllRewards(), listTravelPlans()])
      .then(([loadedRewards, loadedPlans]) => {
        setRewards(loadedRewards);
        setPlans(loadedPlans);
      })
      .catch(() => {
        setRewards([]);
        setPlans([]);
      });
  }, []);

  async function handleCopy(reward: Reward) {
    try {
      await navigator.clipboard.writeText(reward.code);
      setCopiedId(reward.id);
      setTimeout(() => setCopiedId((current) => (current === reward.id ? null : current)), 2000);
    } catch {
      // 클립보드 권한이 없는 브라우저에서도 코드 자체는 화면에 보이니 문제 없음
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            내 리워드
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            여행 계획을 완주할 때마다 받은 리워드를 모아봤어요. 아직 실제 매장에서
            교환할 수 있는 건 아니고, NH 계열사 연계가 정해지면 이 코드로 실제
            혜택을 받을 수 있게 이어질 예정이에요.
          </p>
        </div>

        {rewards === null ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">불러오는 중...</p>
        ) : rewards.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            아직 받은 리워드가 없어요.{" "}
            <Link href="/plan" className="text-blue-600 hover:underline dark:text-blue-400">
              여행 계획 세우고 완주해보기 →
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rewards.map((reward) => {
              const plan = plans.find((p) => p.id === reward.travelPlanId);

              return (
                <li
                  key={reward.id}
                  className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        {reward.title}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {reward.description}
                      </p>
                      {plan && (
                        <Link
                          href={`/calendar/${plan.id}`}
                          className="text-xs text-amber-600 hover:underline dark:text-amber-500"
                        >
                          {plan.title} 보기 →
                        </Link>
                      )}
                    </div>
                    {reward.claimedAt && (
                      <span className="whitespace-nowrap text-xs text-amber-600 dark:text-amber-500">
                        {reward.claimedAt.slice(0, 10)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-mono font-semibold tracking-wider text-amber-900 shadow-sm dark:bg-zinc-900 dark:text-amber-200">
                      {reward.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(reward)}
                      className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
                    >
                      {copiedId === reward.id ? "✓ 복사됨" : "코드 복사"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
