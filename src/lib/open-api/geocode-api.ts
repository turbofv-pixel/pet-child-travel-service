/**
 * 주소/장소명 → 좌표 변환(지오코딩).
 *
 * - 카카오 로컬 API(`KAKAO_REST_API_KEY`)가 있으면 그걸 우선 씁니다 (한국
 *   주소/장소명 정확도가 훨씬 좋음). https://developers.kakao.com/docs/latest/ko/local/dev-guide
 * - 키가 없거나 호출이 실패하면 키가 필요 없는 OpenStreetMap Nominatim으로
 *   대체합니다. Nominatim은 초당 1건 제한 등 사용 정책이 있어 트래픽이
 *   많아지면 카카오 키 발급을 권장합니다.
 *   https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeocodeResult {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export class GeocodeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodeApiError";
  }
}

interface KakaoKeywordResponse {
  documents: {
    place_name: string;
    address_name: string;
    x: string; // 경도
    y: string; // 위도
  }[];
}

async function geocodeWithKakao(query: string): Promise<GeocodeResult[]> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    throw new GeocodeApiError("KAKAO_REST_API_KEY가 설정되어 있지 않아요.");
  }

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `KakaoAK ${restApiKey}` } });
  } catch {
    throw new GeocodeApiError("카카오 로컬 API 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new GeocodeApiError(`카카오 로컬 API 요청 실패 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as KakaoKeywordResponse;

  return body.documents.map((doc) => ({
    label: doc.place_name,
    address: doc.address_name,
    lat: Number(doc.y),
    lng: Number(doc.x),
  }));
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(query)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Nominatim 사용 정책상 식별 가능한 User-Agent가 필요합니다.
      headers: { "User-Agent": "pet-child-travel-service (contact: none)" },
    });
  } catch {
    throw new GeocodeApiError("Nominatim 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new GeocodeApiError(`Nominatim 요청 실패 (HTTP ${res.status})`);
  }

  const items = (await res.json()) as NominatimItem[];

  return items.map((item) => ({
    label: item.display_name.split(",")[0],
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

export interface GeocodeSearchResult {
  results: GeocodeResult[];
  source: "kakao" | "nominatim";
}

export async function geocodeWithFallback(query: string): Promise<GeocodeSearchResult> {
  if (process.env.KAKAO_REST_API_KEY) {
    try {
      return { results: await geocodeWithKakao(query), source: "kakao" };
    } catch {
      // 카카오 실패 시 Nominatim으로 계속 진행
    }
  }

  return { results: await geocodeWithNominatim(query), source: "nominatim" };
}
