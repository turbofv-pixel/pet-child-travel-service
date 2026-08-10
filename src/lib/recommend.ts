import type { CompanionType, Coordinates, Spot } from "@/types";
import { sampleSpots } from "@/data/spots.sample";
import { haversineDistanceKm } from "./geo";

export interface RecommendationQuery {
  companionType: CompanionType;
  /** 사용자가 지정한 대략적인 위치 */
  location: Coordinates;
  /** 검색 반경(km). 기본값 50km */
  radiusKm?: number;
  /**
   * 여행 예정일 (ISO date). 아직 날짜 기반 필터링(휴무일 등)은 붙어있지
   * 않지만, 캘린더 연동 시 이 값을 기준으로 필터링할 예정이라 인터페이스에
   * 미리 반영해둡니다.
   */
  date?: string;
}

export interface RecommendedSpot extends Spot {
  /** 지정한 위치로부터의 거리(km) */
  distanceKm: number;
}

const DEFAULT_RADIUS_KM = 50;

/**
 * 위치·동반 유형 기준으로 가볼만한 곳을 추천합니다.
 * 오픈API 연동 전까지는 `sampleSpots`를 기본 데이터로 사용하고,
 * 연동 후에는 `spots` 인자에 API 응답을 매핑한 배열을 넘기면 됩니다.
 */
export function recommendSpots(
  query: RecommendationQuery,
  spots: Spot[] = sampleSpots,
): RecommendedSpot[] {
  const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;

  return spots
    .filter((spot) => spot.companionType === query.companionType)
    .map((spot) => ({
      ...spot,
      distanceKm: haversineDistanceKm(query.location, spot.location),
    }))
    .filter((spot) => spot.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
