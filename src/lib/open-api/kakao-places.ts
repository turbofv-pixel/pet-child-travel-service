import type { CompanionType, Spot } from "@/types";

/**
 * 카카오 로컬 API 키워드 검색으로 추천 데이터를 보강합니다.
 *
 * TourAPI의 반려동물 동반 정보(`detailPetTour2`)는 등록된 곳 자체가 적어서
 * (큐레이션된 일부 관광지만 해당) 지역에 따라 결과가 거의 없을 수 있어요.
 * 카카오맵에는 실제 업소들이 스스로 "애견동반" 같은 키워드로 등록해둔 경우가
 * 많아서, 같은 지오코딩용 REST 키로 위치기반 키워드 검색을 한 번 더 돌려서
 * 후보를 넓힙니다. KAKAO_REST_API_KEY가 없으면 그냥 빈 배열을 반환해서,
 * TourAPI 결과만으로도 기존처럼 동작합니다 (필수 기능이 아니라 보강 기능).
 */

const PET_FRIENDLY_KEYWORDS = ["애견동반", "반려동물 동반"];
/** 카카오 로컬 API 반경 제한 (미터) */
const MAX_RADIUS_METERS = 20000;

interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  x: string; // 경도
  y: string; // 위도
}

interface KakaoKeywordResponse {
  documents: KakaoKeywordDocument[];
}

async function searchKakaoKeyword(
  query: string,
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<KakaoKeywordDocument[]> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) return [];

  const params = new URLSearchParams({
    query,
    x: String(lng),
    y: String(lat),
    radius: String(Math.min(radiusMeters, MAX_RADIUS_METERS)),
    sort: "distance",
    size: "15",
  });

  try {
    const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
      headers: { Authorization: `KakaoAK ${restApiKey}` },
    });
    if (!res.ok) return [];

    const body = (await res.json()) as KakaoKeywordResponse;
    return body.documents;
  } catch {
    return [];
  }
}

function toSpot(doc: KakaoKeywordDocument, companionType: CompanionType): Spot | null {
  const lat = Number(doc.y);
  const lng = Number(doc.x);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    id: `kakao-${doc.id}`,
    name: doc.place_name,
    companionType,
    sourceId: doc.id,
    address: doc.road_address_name || doc.address_name || "",
    location: { lat, lng },
    hasAudioGuide: false,
  };
}

/**
 * 반려동물 동반 가능 업소를 카카오 키워드 검색으로 추가 수집합니다.
 * 실패하거나 키가 없으면 조용히 빈 배열을 반환합니다 (TourAPI 결과에 얹는
 * 보강용이라, 이것 때문에 전체 추천이 실패하면 안 돼요).
 */
export async function fetchPetFriendlyPlacesFromKakao(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<Spot[]> {
  const resultsByKeyword = await Promise.all(
    PET_FRIENDLY_KEYWORDS.map((keyword) => searchKakaoKeyword(keyword, lat, lng, radiusMeters)),
  );

  const seen = new Set<string>();
  const spots: Spot[] = [];

  for (const docs of resultsByKeyword) {
    for (const doc of docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const spot = toSpot(doc, "pet");
      if (spot) spots.push(spot);
    }
  }

  return spots;
}
