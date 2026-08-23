"use client";

import { useEffect, useState } from "react";
import type { Coordinates } from "@/types";

export interface LocationValue {
  location: Coordinates;
  label: string;
}

const QUICK_PRESETS: LocationValue[] = [
  { label: "서울", location: { lat: 37.5665, lng: 126.978 } },
  { label: "안산", location: { lat: 37.3219, lng: 126.8309 } },
  { label: "시흥", location: { lat: 37.3809, lng: 126.7398 } },
  { label: "용인", location: { lat: 37.3222, lng: 127.098 } },
  { label: "제주", location: { lat: 33.4996, lng: 126.5312 } },
];

const DEFAULT_LOCATION = QUICK_PRESETS[0];

interface GeocodeResult {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

/**
 * 위치 선택 UI - 세 가지 방법을 제공합니다.
 * 1) 마운트 시 자동으로 현재 위치 탐색 시도 (거부/실패하면 기본 프리셋으로)
 * 2) "현위치 사용" 버튼으로 다시 시도
 * 3) 장소명 직접 검색 (지오코딩 오픈API, /api/geocode)
 * 4) 빠른 선택 프리셋 칩
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "unsupported">(
    "idle",
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }

    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoStatus("idle");
        onChange({
          label: "현재 위치",
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
        });
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  useEffect(() => {
    // 최초 진입 시 기본값으로 현재 위치를 시도해봅니다 (실패하면 조용히 기본
    // 프리셋 유지). geolocation 요청 자체가 비동기 브라우저 API 호출이라
    // 마운트 시 한 번 트리거하는 게 정확히 useEffect의 용도입니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(query.trim())}`);
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error ?? "위치를 찾지 못했어요.");
      }
      if (body.results.length === 0) {
        setSearchError("검색 결과가 없어요. 다른 키워드로 시도해보세요.");
      }
      setResults(body.results);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "위치 검색 중 오류가 발생했어요.");
    } finally {
      setIsSearching(false);
    }
  }

  function pickResult(result: GeocodeResult) {
    onChange({ label: result.label, location: { lat: result.lat, lng: result.lng } });
    setResults(null);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-black/[.06] px-3 py-1.5 text-sm text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
          📍 {value.label}
        </span>
        <button
          type="button"
          onClick={locate}
          className="rounded-full border border-black/[.08] px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-black/[.06] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]"
        >
          {geoStatus === "locating" ? "위치 확인 중..." : "🎯 현위치 사용"}
        </button>
      </div>

      {geoStatus === "denied" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          위치 권한이 거부됐어요. 브라우저 설정에서 허용하거나, 아래에서 직접 검색/선택해주세요.
        </p>
      )}
      {geoStatus === "unsupported" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          이 브라우저는 위치 확인을 지원하지 않아요. 아래에서 직접 검색/선택해주세요.
        </p>
      )}

      {/*
        /plan 페이지의 바깥쪽 <form>(여행지 추천 폼) 안에 이 컴포넌트가
        들어가기 때문에, 여기서는 <form>을 쓰지 않습니다 - <form> 중첩은
        잘못된 HTML이라 브라우저가 파싱 시 구조를 바꿔버려서 하이드레이션
        에러(React #418)가 났었어요. 대신 input의 Enter 키 + 버튼 클릭으로
        직접 처리합니다.
      */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="장소/주소 검색 (예: 해운대해수욕장, 강남구청)"
          className="flex-1 rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.06] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.08]"
        >
          {isSearching ? "검색 중..." : "검색"}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-600 dark:text-red-400">{searchError}</p>
      )}

      {results && results.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg border border-black/[.08] bg-white p-2 dark:border-white/[.145] dark:bg-zinc-900">
          {results.map((result) => (
            <li key={`${result.lat}-${result.lng}`}>
              <button
                type="button"
                onClick={() => pickResult(result)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/[.06] dark:hover:bg-white/[.08]"
              >
                <span className="font-medium text-black dark:text-zinc-50">{result.label}</span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {result.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              value.label === preset.label
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_LOCATION };
