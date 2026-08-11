"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanionType, Coordinates, WeatherSummary } from "@/types";
import type { RecommendedSpot } from "@/lib/recommend";
import { createTravelPlan } from "@/lib/storage/travel-plans";
import { kakaoMapDirectionsUrl, kakaoMapViewUrl } from "@/lib/map-links";

/**
 * 위치 오픈API(지오코딩) 연동 전까지 쓰는 프리셋 지역입니다.
 * 실제 서비스에서는 주소 검색/현재 위치로 대체될 예정이에요.
 */
const PRESET_LOCATIONS: { label: string; location: Coordinates }[] = [
  { label: "서울", location: { lat: 37.5665, lng: 126.978 } },
  { label: "안산", location: { lat: 37.3219, lng: 126.8309 } },
  { label: "시흥", location: { lat: 37.3809, lng: 126.7398 } },
  { label: "용인", location: { lat: 37.3222, lng: 127.098 } },
  { label: "제주", location: { lat: 33.4996, lng: 126.5312 } },
];

const PRECIPITATION_LABEL: Record<WeatherSummary["precipitationType"], string> = {
  none: "강수 없음",
  rain: "비",
  "rain-snow": "비/눈",
  snow: "눈",
  shower: "소나기",
};

function todayIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function PlanPage() {
  const router = useRouter();

  const [companionType, setCompanionType] = useState<CompanionType>("pet");
  const [locationIndex, setLocationIndex] = useState(0);
  const [radiusKm, setRadiusKm] = useState(50);

  const [spots, setSpots] = useState<RecommendedSpot[] | null>(null);
  const [source, setSource] = useState<"live" | "sample" | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null);

  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<string>>(new Set());
  const [planTitle, setPlanTitle] = useState("");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate(1));
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleSpot(id: string) {
    setSelectedSpotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveError(null);
    setSelectedSpotIds(new Set());

    const { location } = PRESET_LOCATIONS[locationIndex];

    try {
      const params = new URLSearchParams({
        companionType,
        lat: String(location.lat),
        lng: String(location.lng),
        radiusKm: String(radiusKm),
      });

      const response = await fetch(`/api/recommendations?${params}`);

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "추천 결과를 불러오지 못했어요.");
      }

      const body = await response.json();
      setSpots(body.spots);
      setSource(body.source);
      setWarning(body.warning ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
      setSpots(null);
      setSource(null);
      setWarning(null);
    } finally {
      setIsLoading(false);
    }

    // 날씨는 추천 결과와 별개로 실패해도 전체 흐름을 막지 않도록 독립적으로 처리
    try {
      const weatherParams = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
      });
      const weatherRes = await fetch(`/api/weather?${weatherParams}`);
      const weatherBody = await weatherRes.json();
      setWeather(weatherBody.weather ?? null);
      setWeatherWarning(weatherBody.warning ?? null);
    } catch {
      setWeather(null);
      setWeatherWarning(null);
    }
  }

  function handleSavePlan() {
    setSaveError(null);

    if (!spots) return;
    const selected = spots.filter((spot) => selectedSpotIds.has(spot.id));

    if (selected.length === 0) {
      setSaveError("계획에 담을 여행지를 1곳 이상 선택해주세요.");
      return;
    }
    if (!planTitle.trim()) {
      setSaveError("여행 계획 제목을 입력해주세요.");
      return;
    }
    if (startDate > endDate) {
      setSaveError("종료일이 시작일보다 빠를 수 없어요.");
      return;
    }

    const plan = createTravelPlan({
      title: planTitle.trim(),
      companionType,
      startDate,
      endDate,
      spots: selected,
    });

    router.push(`/calendar/${plan.id}`);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            여행 계획 추천받기
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            동반 유형과 대략적인 위치를 고르면 근처 가볼만한 곳을 추천해드려요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              누구와 함께 가나요?
            </legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="companionType"
                  value="pet"
                  checked={companionType === "pet"}
                  onChange={() => setCompanionType("pet")}
                />
                🐾 반려동물과
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="companionType"
                  value="child"
                  checked={companionType === "child"}
                  onChange={() => setCompanionType("child")}
                />
                🧒 아이와
              </label>
            </div>
          </fieldset>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            대략적인 위치
            <select
              value={locationIndex}
              onChange={(e) => setLocationIndex(Number(e.target.value))}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            >
              {PRESET_LOCATIONS.map((preset, index) => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            검색 반경 (km)
            <input
              type="number"
              min={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {isLoading ? "추천 받는 중..." : "추천받기"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {weather && (
          <div className="flex items-center gap-3 rounded-xl border border-black/[.08] bg-white p-4 text-sm dark:border-white/[.145] dark:bg-zinc-950">
            <span className="text-2xl">
              {weather.precipitationType === "none" ? "☀️" : "🌧️"}
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {PRESET_LOCATIONS[locationIndex].label} 현재 {weather.temperatureCelsius}
              °C · 습도 {weather.humidityPercent}% ·{" "}
              {PRECIPITATION_LABEL[weather.precipitationType]}
            </span>
          </div>
        )}
        {weatherWarning && (
          <p className="text-xs text-zinc-400">☁️ 날씨 정보 없음: {weatherWarning}</p>
        )}

        {spots && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                추천 결과 ({spots.length}곳)
              </h2>
              <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400">
                {source === "live" ? "🌐 오픈API 실시간" : "🧪 샘플 데이터"}
              </span>
            </div>
            {warning && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ {warning}
              </p>
            )}
            {spots.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                반경 안에 추천할 곳이 없어요. 검색 반경을 넓혀보세요.
              </p>
            ) : (
              <>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  여행 계획에 담을 곳을 선택해보세요.
                </p>
                <ul className="flex flex-col gap-3">
                  {spots.map((spot) => (
                    <li
                      key={spot.id}
                      className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedSpotIds.has(spot.id)}
                          onChange={() => toggleSpot(spot.id)}
                          aria-label={`${spot.name} 계획에 담기`}
                        />
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-black dark:text-zinc-50">
                              {spot.name}
                            </span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {spot.distanceKm.toFixed(1)}km
                            </span>
                          </div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {spot.address}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {spot.hasAudioGuide && (
                              <span className="w-fit rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                                🎧 오디오 가이드
                              </span>
                            )}
                            <a
                              href={kakaoMapViewUrl(spot)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              🗺️ 지도에서 보기
                            </a>
                            <a
                              href={kakaoMapDirectionsUrl(spot)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              🚗 길찾기
                            </a>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
                  <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                    선택한 {selectedSpotIds.size}곳으로 여행 계획 저장
                  </h3>
                  <input
                    type="text"
                    placeholder="여행 계획 제목 (예: 주말 강아지 나들이)"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <div className="flex gap-3">
                    <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                      시작일
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                      종료일
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </label>
                  </div>
                  {saveError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {saveError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                  >
                    📅 여행 계획으로 저장
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
