"use client";

const RADIUS_OPTIONS_KM = [5, 10, 15, 20, 50, 100] as const;

interface RadiusStepperProps {
  value: number;
  onChange: (radiusKm: number) => void;
}

/** 5/10/15/20/50/100km 중에서 고르거나, ±버튼으로 한 단계씩 오갈 수 있는 반경 선택 UI. */
export function RadiusStepper({ value, onChange }: RadiusStepperProps) {
  const currentIndex = RADIUS_OPTIONS_KM.indexOf(value as (typeof RADIUS_OPTIONS_KM)[number]);

  function step(delta: number) {
    const fromIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = Math.min(
      RADIUS_OPTIONS_KM.length - 1,
      Math.max(0, fromIndex + delta),
    );
    onChange(RADIUS_OPTIONS_KM[nextIndex]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={currentIndex <= 0}
          aria-label="검색 반경 한 단계 줄이기"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-black/[.06] disabled:opacity-30 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]"
        >
          −
        </button>

        {RADIUS_OPTIONS_KM.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              value === option
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            }`}
          >
            {option}km
          </button>
        ))}

        <button
          type="button"
          onClick={() => step(1)}
          disabled={currentIndex === RADIUS_OPTIONS_KM.length - 1}
          aria-label="검색 반경 한 단계 늘리기"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-black/[.06] disabled:opacity-30 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]"
        >
          +
        </button>
      </div>
      {currentIndex === -1 && (
        <p className="text-xs text-zinc-400">현재 반경: {value}km (프리셋 외 값)</p>
      )}
    </div>
  );
}
