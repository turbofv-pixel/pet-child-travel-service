"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TravelPlan } from "@/types";
import { deleteTravelPlan, listTravelPlans } from "@/lib/storage/travel-plans";

const COMPANION_LABEL: Record<TravelPlan["companionType"], string> = {
  pet: "🐾 반려동물과",
  child: "🧒 아이와",
};

function isPlanOnDate(plan: TravelPlan, isoDate: string): boolean {
  return plan.startDate <= isoDate && isoDate <= plan.endDate;
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function CalendarPage() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    // localStorage는 서버에 없는 외부 저장소라 마운트 후(클라이언트에서만)
    // 읽어와야 SSR과 하이드레이션 결과가 어긋나지 않습니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(listTravelPlans());
  }, []);

  function handleDelete(id: string) {
    deleteTravelPlan(id);
    setPlans(listTravelPlans());
  }

  const { year, month } = cursor;
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            내 여행 캘린더
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            /plan에서 저장한 여행 계획을 달력으로 확인하고 가족·친구와 공유할
            준비를 해보세요.
          </p>
        </div>

        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCursor((c) =>
                  c.month === 0
                    ? { year: c.year - 1, month: 11 }
                    : { year: c.year, month: c.month - 1 },
                )
              }
              className="rounded-full px-3 py-1 text-sm text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            >
              ← 이전
            </button>
            <span className="font-semibold text-black dark:text-zinc-50">
              {year}년 {month + 1}월
            </span>
            <button
              type="button"
              onClick={() =>
                setCursor((c) =>
                  c.month === 11
                    ? { year: c.year + 1, month: 0 }
                    : { year: c.year, month: c.month + 1 },
                )
              }
              className="rounded-full px-3 py-1 text-sm text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            >
              다음 →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;
              const iso = toIsoDate(year, month, day);
              const dayPlans = plans.filter((plan) => isPlanOnDate(plan, iso));
              const isToday = iso === todayIso;

              return (
                <div
                  key={iso}
                  className={`flex flex-col items-center gap-0.5 rounded-lg py-2 ${
                    isToday ? "bg-black/[.06] dark:bg-white/[.08]" : ""
                  }`}
                >
                  <span className="text-black dark:text-zinc-50">{day}</span>
                  {dayPlans.length > 0 && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      ●
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
            저장한 여행 계획 ({plans.length}개)
          </h2>

          {plans.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              아직 저장한 여행 계획이 없어요.{" "}
              <Link href="/plan" className="text-blue-600 hover:underline dark:text-blue-400">
                여행 계획 추천받으러 가기 →
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
                >
                  <Link href={`/calendar/${plan.id}`} className="flex flex-1 flex-col gap-1">
                    <span className="font-medium text-black dark:text-zinc-50">
                      {plan.title}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {COMPANION_LABEL[plan.companionType]} · {plan.startDate} ~{" "}
                      {plan.endDate} · {plan.spots.length}곳
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan.id)}
                    className="rounded-full px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
