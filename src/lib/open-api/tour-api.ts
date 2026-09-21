import type { CompanionType, Spot } from "@/types";
import { normalizeServiceKey } from "./service-key";
import { extractGatewayErrorMessage } from "./gateway-error";

/**
 * 한국관광공사 TourAPI 연동.
 *
 * - 어린이 동반 추천: KorService2 `locationBasedList2` (국문 관광정보 서비스,
 *   data.go.kr에서 흔히 쓰이는 안정적인 엔드포인트)
 *   https://www.data.go.kr/data/15101578/openapi.do
 * - 반려동물 동반 추천: 처음엔 "반려동물 동반여행 서비스"라는 별도
 *   상품(KorPetTourService)이 있는 줄 알고 그쪽으로 만들었는데, 실제로는
 *   그런 별도 서비스가 없고(NO_OPENAPI_SERVICE_ERROR) - 반려동물 동반 정보는
 *   같은 KorService2 안의 상세조회 오퍼레이션(`detailPetTour2`)으로
 *   contentId별로 조회하는 방식이었습니다. 그래서 일반 위치기반 조회로 후보를
 *   가져온 뒤, 각 후보의 반려동물 동반 상세정보가 존재하는지로 필터링합니다.
 */

const DEFAULT_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const MOBILE_APP = "PetChildTravelPlanner";
/**
 * 반려동물 동반 상세조회를 몇 개 후보까지 확인해볼지 (API 호출 수 제한용).
 * 반려동물 동반 정보가 등록된 곳 자체가 전체 관광지 중 일부라서, 후보를
 * 적게 가져오면(예: 15개) 근처에 하나도 안 걸릴 때가 많아요(반경을 넓혀도
 * 특정 지역에서만 결과가 나오는 것처럼 보이는 원인). 그래서 넉넉히
 * 확인합니다.
 */
const MAX_PET_DETAIL_LOOKUPS = 40;

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
  const serviceKey = normalizeServiceKey(requireApiKey());
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  return `${baseUrl}/${endpoint}?${searchParams.toString()}&serviceKey=${serviceKey}`;
}

async function callTourApi(url: string): Promise<TourApiRawItem[]> {
  let res: Response;

  try {
    res = await fetch(url, { next: { revalidate: 60 * 30 } });
  } catch {
    throw new TourApiError("TourAPI 요청 중 네트워크 오류가 발생했어요.");
  }

  const rawBodyText = await res.text().catch(() => "");
  let parsedBody: unknown;
  try {
    parsedBody = rawBodyText ? JSON.parse(rawBodyText) : undefined;
  } catch {
    parsedBody = undefined;
  }

  // data.go.kr은 서비스 미등록/트래픽 초과 같은 "게이트웨이 레벨" 오류를
  // TourAPI 자체 응답 형식과 다른 별도 형식으로 돌려주는데, 이건 HTTP
  // 상태코드가 200으로 올 때도 있어서 !res.ok 체크만으로는 못 잡습니다.
  const gatewayError = extractGatewayErrorMessage(parsedBody);
  if (gatewayError) {
    throw new TourApiError(`data.go.kr 게이트웨이 오류: ${gatewayError}`);
  }

  if (!res.ok) {
    throw new TourApiError(
      `TourAPI 요청 실패 (HTTP ${res.status})` +
        (rawBodyText ? ` - ${rawBodyText.slice(0, 300)}` : "") +
        (res.status === 400
          ? " (TOUR_API_KEY 값을 다시 확인해보세요 - data.go.kr의 'Decoding' 키를 넣는 걸 권장해요)"
          : ""),
    );
  }

  if (!parsedBody) {
    throw new TourApiError(
      "TourAPI 응답을 JSON으로 해석하지 못했어요 (serviceKey 오류 등으로 XML 에러 응답이 왔을 수 있어요).",
    );
  }

  const body = parsedBody as TourApiResponse;

  if (!body.response?.header) {
    throw new TourApiError(
      `TourAPI 응답 형식이 예상과 달라요: ${rawBodyText.slice(0, 300)}`,
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

/** 위치기반 관광정보 후보 목록 조회 (어린이/반려동물 공통으로 재사용) */
async function fetchNearbyCandidates(
  options: FetchNearbySpotsOptions,
): Promise<TourApiRawItem[]> {
  const baseUrl = process.env.TOUR_API_BASE_URL ?? DEFAULT_BASE_URL;
  const url = buildUrl(baseUrl, "locationBasedList2", {
    numOfRows: options.numOfRows ?? 20,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: MOBILE_APP,
    _type: "json",
    arrange: "E", // 거리순
    mapX: options.lng,
    mapY: options.lat,
    radius: Math.min(options.radiusMeters ?? MAX_RADIUS_METERS, MAX_RADIUS_METERS),
    contentTypeId: options.contentTypeId,
  });

  return callTourApi(url);
}

/** 어린이 동반 여행 추천용 - 일반 관광정보 위치기반 조회 */
export async function fetchNearbyTourSpots(
  options: FetchNearbySpotsOptions,
): Promise<Spot[]> {
  const items = await fetchNearbyCandidates(options);
  return items
    .map((item) => toSpot(item, "child"))
    .filter((spot): spot is Spot => spot !== null);
}

/** contentId에 반려동물 동반 상세정보가 등록돼 있는지 확인 (없으면 false). */
async function hasPetAccompanyInfo(contentId: string): Promise<boolean> {
  const baseUrl = process.env.TOUR_API_BASE_URL ?? DEFAULT_BASE_URL;
  const url = buildUrl(baseUrl, "detailPetTour2", {
    contentId,
    MobileOS: "ETC",
    MobileApp: MOBILE_APP,
    _type: "json",
  });

  try {
    const items = await callTourApi(url);
    return items.length > 0;
  } catch {
    // 이 contentId에 반려동물 정보가 없는 경우도 NODATA_ERROR 등으로 오는데,
    // 후보 하나하나가 실패했다고 전체 추천을 실패시킬 필요는 없어서
    // "반려동물 동반 가능 정보 없음"으로 조용히 취급합니다.
    return false;
  }
}

/**
 * 반려동물 동반 여행 추천용.
 *
 * TourAPI에는 반려동물 전용 위치기반 검색 API가 따로 없고, 일반 위치기반
 * 조회로 후보를 가져온 뒤 각 후보의 반려동물 동반 상세정보(`detailPetTour2`)
 * 존재 여부로 필터링해야 합니다. 후보가 많으면 상세조회 호출도 그만큼
 * 늘어나서, MAX_PET_DETAIL_LOOKUPS개까지만 확인합니다.
 */
export async function fetchNearbyPetFriendlySpots(
  options: FetchNearbySpotsOptions,
): Promise<Spot[]> {
  const candidates = await fetchNearbyCandidates({
    ...options,
    numOfRows: options.numOfRows ?? MAX_PET_DETAIL_LOOKUPS,
  });
  const toCheck = candidates.slice(0, MAX_PET_DETAIL_LOOKUPS);

  const petFriendlyFlags = await Promise.all(
    toCheck.map((item) => hasPetAccompanyInfo(item.contentid)),
  );

  return toCheck
    .filter((_, index) => petFriendlyFlags[index])
    .map((item) => toSpot(item, "pet"))
    .filter((spot): spot is Spot => spot !== null);
}

interface DetailCommonRawItem {
  overview?: string;
}

interface TourApiDetailResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: DetailCommonRawItem[] | DetailCommonRawItem };
    };
  };
}

/** HTML 태그와 반복 공백을 정리해서 TTS로 읽기 좋은 평문으로 만듭니다. */
function cleanOverviewText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * 관광지 소개글(오디오 가이드용 스크립트)을 상세조회로 가져옵니다.
 * 등록된 소개글이 없으면 null을 반환합니다 (TourAPI 원본이 아닌 스팟
 * -contentId도 마찬가지로 null).
 */
export async function fetchSpotOverview(contentId: string): Promise<string | null> {
  const baseUrl = process.env.TOUR_API_BASE_URL ?? DEFAULT_BASE_URL;
  const url = buildUrl(baseUrl, "detailCommon2", {
    contentId,
    MobileOS: "ETC",
    MobileApp: MOBILE_APP,
    _type: "json",
    defaultYN: "Y",
    overviewYN: "Y",
    firstImageYN: "N",
    areacodeYN: "N",
    catcodeYN: "N",
    addrinfoYN: "N",
    mapinfoYN: "N",
  });

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  } catch {
    throw new TourApiError("TourAPI 요청 중 네트워크 오류가 발생했어요.");
  }

  const rawBodyText = await res.text().catch(() => "");
  let parsedBody: unknown;
  try {
    parsedBody = rawBodyText ? JSON.parse(rawBodyText) : undefined;
  } catch {
    parsedBody = undefined;
  }

  const gatewayError = extractGatewayErrorMessage(parsedBody);
  if (gatewayError) {
    throw new TourApiError(`data.go.kr 게이트웨이 오류: ${gatewayError}`);
  }

  if (!res.ok || !parsedBody) {
    throw new TourApiError(`TourAPI 요청 실패 (HTTP ${res.status})`);
  }

  const body = parsedBody as TourApiDetailResponse;
  if (!body.response?.header) {
    throw new TourApiError(
      `TourAPI 응답 형식이 예상과 달라요: ${rawBodyText.slice(0, 300)}`,
    );
  }

  const { resultCode, resultMsg } = body.response.header;
  if (resultCode !== "0000") {
    // NODATA_ERROR(03) 등 - 이 contentId엔 그냥 소개글이 없는 경우가 대부분
    if (resultCode === "03") return null;
    throw new TourApiError(`TourAPI 오류 (${resultCode}): ${resultMsg}`);
  }

  const rawItem = body.response.body?.items?.item;
  const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
  const overview = item?.overview?.trim();

  if (!overview) return null;
  return cleanOverviewText(overview);
}
