"use client";

import type { Spot } from "@/types";
import { googleMapsDirectionsUrl, kakaoMapDirectionsUrl, kakaoMapViewUrl } from "@/lib/map-links";
import { openNaverMapDirections, openTmapDirections } from "@/lib/open-map-app";

const linkClass =
  "text-xs font-medium text-blue-600 hover:underline dark:text-blue-400";
const buttonClass = `${linkClass} bg-transparent`;

/**
 * 지도 보기 + 4개 지도앱(카카오/네이버/티맵/구글) 길찾기 버튼 묶음.
 * 카카오는 웹 링크가 있지만 앱 미설치 시 불안정하다는 보고가 있어(map-links.ts
 * 참고), 대안으로 네이버/티맵/구글도 함께 제공합니다.
 */
export function SpotActionLinks({ spot }: { spot: Spot }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
      <a
        href={kakaoMapViewUrl(spot)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        🗺️ 지도에서 보기
      </a>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">길찾기:</span>
      <a href={kakaoMapDirectionsUrl(spot)} className={linkClass}>
        카카오
      </a>
      <button type="button" onClick={() => openNaverMapDirections(spot)} className={buttonClass}>
        네이버
      </button>
      <button type="button" onClick={() => openTmapDirections(spot)} className={buttonClass}>
        티맵
      </button>
      <a
        href={googleMapsDirectionsUrl(spot)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        구글
      </a>
    </div>
  );
}
