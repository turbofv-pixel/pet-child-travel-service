import type { CompanionType, Spot } from "@/types";

/**
 * 한국관광공사 TourAPI 연동.
 *
 * - 어린이 동반 추천: KorService2 `locationBasedList2` (국문 관광정보 서비스,
 *   data.go.kr에서 흔히 쓰이는 안정적인 엔드포인트)
 *   https://www.data.go.kr/data/15101578/openapi.do
 * - 반려동물 동반 추천: "반려동물 동반여행 서비스"
 *   data.go.kr에서 별도로 활용신청해야 하는 서비스라, 엔드포인트 이름/버전이
 *   문서 개편에 따라 바뀔 수 있어요. 아래 DEFAULT_PET_BASE_URL은 문서 기준
 *   최선의 추정값이니, 실제로 신청한 서비스의 활용가이드에서 정확한 경로를
 *   확인하고 다르면 TOUR_PET_API_BASE_URL 환경변수로 덮어써주세요.
 */

const DEFAULT_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const DEFAULT_PET_BASE_URL =
  "https://apis.data.go.kr/B551011/KorPetTourService1";
const MOBILE_APP = "PetChildTravelPlanner";

/** TourAPI 최대 검색 반경 (미터) */
const MAX_RADIUS_METERS = 20000;

export class TourApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TourApiError";
  }
}

interface TourApiRawItem {
  contentid: string;
  contenttypeid?: string;
  title: string;
  addr1?: string;
  mapx?: string; // 경도
  mapy?: string; // 위도
}

interface TourApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: TourApiRawItem[] | TourApiRawItem };
      totalCount?: number;
    };
  };
}

export interface FetchNearbySpotsOptions {
  lat: number;
  lng: number;
  /** 검색 반경 (미터). TourAPI 제한상 최대 20000(20km)까지만 허용됩니다. */
  radiusMeters?: number;
  numOfRows?: number;
  contentTypeId?: string;
}

function requireApiKey(): string {
  const key = process.env.TOUR_API_KEY;
  if (!key) {
    throw new TourApiError(
      "TOUR_API_KEY가 설정되어 있지 않아요. data.go.kr에서 '한국관광공사_국문 관광정보 서비스'를 활용신청한 뒤 .env.local에 키를 넣어주세요.",
    );
  }
  return key;
}

function buildUrl(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const serviceKey = requireApiKey();
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  // serviceKey는 data.go.kr에서 이미 URL 인코딩된 형태로 발급되는 경우가
  // 많아서, URLSearchParams로 한 번 더 인코딩하면 깨질 수 있습니다.
  // 그래서 나머지 파라미터만 인코딩하고 serviceKey는 그대로 이어붙입니다.
  return `${baseUrl}/${endpoint}?${searchParams.toString()}&serviceKey=${serviceKey}`;
}

async function callTourApi(url: string): Promise<TourApiRawItem[]> {
  let res: Response;

  try {
    res = await fetch(url, { next: { revalidate: 60 * 30 } });
  } catch {
    throw new TourApiError("TourAPI 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new TourApiError(`TourAPI 요청 실패 (HTTP ${res.status})`);
  }

  let body: TourApiResponse;
  try {
    body = (await res.json()) as TourApiResponse;
  } catch {
    throw new TourApiError(
      "TourAPI 응답을 JSON으로 해석하지 못했어요 (serviceKey 오류 등으로 XML 에러 응답이 왔을 수 있어요).",
    );
  }

  const { resultCode, resultMsg } = body.response.header;
  if (resultCode !== "0000") {
    throw new TourApiError(`TourAPI 오류 (${resultCode}): ${resultMsg}`);
  }

  const item = body.response.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function toSpot(
  item: TourApiRawItem,
  companionType: CompanionType,
): Spot | null {
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);

  if (!item.title || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    id: `tourapi-${item.contentid}`,
    name: item.title,
    companionType,
    sourceId: item.contentid,
    address: item.addr1 ?? "",
    location: { lat, lng },
    // TODO: 상세조회(detailIntro2 등) 연동 시 실제 오디오 가이드 보유 여부로 대체
    hasAudioGuide: false,
  };
}

/** 어린이 동반 여행 추천용 - 일반 관광정보 위치기반 조회 */
export async function fetchNearbyTourSpots(
  options: FetchNearbySpotsOptions,
): Promise<Spot[]> {
  const baseUrl = process.env.TOUR_API_BASE_URL ?? DEFAULT_BASE_URL;
  const url = buildUrl(baseUrl, "locationBasedList2", {
    numOfRows: options.numOfRows ?? 20,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: MOBILE_APP,
    _type: "json",
    listYN: "Y",
    arrange: "E", // 거리순
    mapX: options.lng,
    mapY: options.lat,
    radius: Math.min(options.radiusMeters ?? MAX_RADIUS_METERS, MAX_RADIUS_METERS),
    contentTypeId: options.contentTypeId,
  });

  const items = await callTourApi(url);
  return items
    .map((item) => toSpot(item, "child"))
    .filter((spot): spot is Spot => spot !== null);
}

/**
 * 반려동물 동반 여행 추천용 - 반려동물 동반여행 서비스.
 * 엔드포인트 경로는 실제 신청한 서비스의 활용가이드로 검증해주세요
 * (다르면 TOUR_PET_API_BASE_URL로 덮어쓸 수 있어요).
 */
export async function fetchNearbyPetFriendlySpots(
  options: FetchNearbySpotsOptions,
): Promise<Spot[]> {
  const baseUrl = process.env.TOUR_PET_API_BASE_URL ?? DEFAULT_PET_BASE_URL;
  const url = buildUrl(baseUrl, "locationBasedList1", {
    numOfRows: options.numOfRows ?? 20,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: MOBILE_APP,
    _type: "json",
    arrange: "E",
    mapX: options.lng,
    mapY: options.lat,
    radius: Math.min(options.radiusMeters ?? MAX_RADIUS_METERS, MAX_RADIUS_METERS),
  });

  const items = await callTourApi(url);
  return items
    .map((item) => toSpot(item, "pet"))
    .filter((spot): spot is Spot => spot !== null);
}
