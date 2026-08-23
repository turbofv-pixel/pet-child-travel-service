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

interface KakaoCoord2AddressResponse {
  documents: {
    road_address?: { address_name: string };
    address?: { address_name: string };
  }[];
}

async function reverseGeocodeWithKakao(lat: number, lng: number): Promise<string> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    throw new GeocodeApiError("KAKAO_REST_API_KEY가 설정되어 있지 않아요.");
  }

  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `KakaoAK ${restApiKey}` } });
  } catch {
    throw new GeocodeApiError("카카오 로컬 API(역지오코딩) 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new GeocodeApiError(`카카오 로컬 API(역지오코딩) 요청 실패 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as KakaoCoord2AddressResponse;
  const doc = body.documents[0];
  const address = doc?.road_address?.address_name ?? doc?.address?.address_name;

  if (!address) {
    throw new GeocodeApiError("이 좌표에 대한 주소를 찾지 못했어요.");
  }
  return address;
}

interface NominatimReverseResponse {
  display_name: string;
}

async function reverseGeocodeWithNominatim(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ko&lat=${lat}&lon=${lng}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "pet-child-travel-service (contact: none)" },
    });
  } catch {
    throw new GeocodeApiError("Nominatim(역지오코딩) 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new GeocodeApiError(`Nominatim(역지오코딩) 요청 실패 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as NominatimReverseResponse;
  if (!body.display_name) {
    throw new GeocodeApiError("이 좌표에 대한 주소를 찾지 못했어요.");
  }
  return body.display_name;
}

export interface ReverseGeocodeResult {
  address: string;
  source: "kakao" | "nominatim";
}

/** 좌표 → 주소 변환 (현재 위치 라벨 표시용). */
export async function reverseGeocodeWithFallback(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  if (process.env.KAKAO_REST_API_KEY) {
    try {
      return { address: await reverseGeocodeWithKakao(lat, lng), source: "kakao" };
    } catch {
      // 카카오 실패 시 Nominatim으로 계속 진행
    }
  }

  return { address: await reverseGeocodeWithNominatim(lat, lng), source: "nominatim" };
}
