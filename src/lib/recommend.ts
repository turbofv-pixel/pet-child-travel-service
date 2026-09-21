import type { CompanionType, Coordinates, Spot } from "@/types";
import { sampleSpots } from "@/data/spots.sample";
import { haversineDistanceKm } from "./geo";
import {
  TourApiError,
  fetchNearbyPetFriendlySpots,
  fetchNearbyTourSpots,
} from "./open-api/tour-api";
import { fetchPetFriendlyPlacesFromKakao } from "./open-api/kakao-places";

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

export interface RecommendationResult {
  spots: RecommendedSpot[];
  /** 실제 오픈API 응답인지, 키가 없거나 호출 실패로 샘플 데이터를 썼는지 */
  source: "live" | "sample";
  /** source가 sample인데 TOUR_API_KEY는 설정된 경우 - 호출 실패 사유 */
  warning?: string;
}

const DEFAULT_RADIUS_KM = 50;

function withDistanceSorted(
  spots: Spot[],
  location: Coordinates,
  radiusKm: number,
): RecommendedSpot[] {
  return spots
    .map((spot) => ({
      ...spot,
      distanceKm: haversineDistanceKm(location, spot.location),
    }))
    .filter((spot) => spot.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * 샘플 데이터 기준 추천. 오픈API 연동 전이거나, 연동 실패 시 폴백으로 씁니다.
 */
export function recommendSpots(
  query: RecommendationQuery,
  spots: Spot[] = sampleSpots,
): RecommendedSpot[] {
  const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;
  const filtered = spots.filter(
    (spot) => spot.companionType === query.companionType,
  );
  return withDistanceSorted(filtered, query.location, radiusKm);
}

/** 두 스팟이 사실상 같은 곳인지 (100m 이내면 중복으로 취급) */
function isNearDuplicate(a: Spot, b: Spot): boolean {
  return haversineDistanceKm(a.location, b.location) < 0.1;
}

/** TourAPI를 직접 호출하는 추천. TOUR_API_KEY가 없으면 TourApiError를 던집니다. */
async function recommendSpotsLive(
  query: RecommendationQuery,
): Promise<RecommendedSpot[]> {
  const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;
  const radiusMeters = radiusKm * 1000;
  const options = {
    lat: query.location.lat,
    lng: query.location.lng,
    radiusMeters,
  };

  let liveSpots: Spot[];

  if (query.companionType === "pet") {
    const [tourApiResult, kakaoSpots] = await Promise.all([
      fetchNearbyPetFriendlySpots(options).catch((error) => ({ error })),
      fetchPetFriendlyPlacesFromKakao(options.lat, options.lng, radiusMeters),
    ]);

    const tourApiSpots = Array.isArray(tourApiResult) ? tourApiResult : [];

    // TourAPI 호출 자체가 실패해도 카카오 쪽에서 뭔가 찾았으면 그걸로
    // 진행합니다 (완전히 비어있을 때만 원래 오류를 그대로 던져서 표준
    // 샘플 데이터 폴백 + 경고 메시지 흐름을 타게 함).
    if (!Array.isArray(tourApiResult) && kakaoSpots.length === 0) {
      throw tourApiResult.error;
    }

    // TourAPI 결과를 우선 유지하고, 카카오 결과 중 이미 있는 곳과 겹치지
    // 않는 것만 추가해서 후보를 넓힙니다 (카카오는 KAKAO_REST_API_KEY 없으면
    // 빈 배열이라, 이 경우 그냥 TourAPI 결과만 남습니다).
    const newFromKakao = kakaoSpots.filter(
      (kakaoSpot) => !tourApiSpots.some((tourSpot) => isNearDuplicate(tourSpot, kakaoSpot)),
    );
    liveSpots = [...tourApiSpots, ...newFromKakao];
  } else {
    liveSpots = await fetchNearbyTourSpots(options);
  }

  return withDistanceSorted(liveSpots, query.location, radiusKm);
}

/**
 * 여행지 추천 진입점.
 * TOUR_API_KEY가 설정되어 있으면 오픈API를 먼저 시도하고,
 * 키가 없거나 호출이 실패하면 샘플 데이터로 조용히 폴백합니다.
 */
export async function recommendSpotsWithFallback(
  query: RecommendationQuery,
): Promise<RecommendationResult> {
  if (!process.env.TOUR_API_KEY) {
    return { spots: recommendSpots(query), source: "sample" };
  }

  try {
    return { spots: await recommendSpotsLive(query), source: "live" };
  } catch (error) {
    return {
      spots: recommendSpots(query),
      source: "sample",
      warning:
        error instanceof TourApiError
          ? error.message
          : "TourAPI 호출 중 알 수 없는 오류가 발생해 샘플 데이터로 대체했어요.",
    };
  }
}
