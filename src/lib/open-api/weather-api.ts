import type { PrecipitationType, WeatherSummary } from "@/types";
import { latLngToKmaGrid } from "./kma-grid";

/**
 * 기상청 단기예보 오픈API - 초단기실황(getUltraSrtNcst) 연동.
 * https://www.data.go.kr/data/15084084/openapi.do ("기상청_단기예보 ((구)_동네예보) 조회서비스")
 *
 * 매시 40분에 그 시각 기준 관측값이 갱신됩니다. 그래서 base_time은 "현재
 * 시각이 40분 이전이면 한 시간 전, 아니면 정시"로 계산합니다.
 */

const DEFAULT_BASE_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export class WeatherApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherApiError";
  }
}

interface KmaItem {
  category: string;
  obsrValue: string;
}

interface KmaResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: { items?: { item?: KmaItem[] | KmaItem } };
  };
}

function requireApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new WeatherApiError(
      "WEATHER_API_KEY가 설정되어 있지 않아요. data.go.kr에서 '기상청_단기예보 조회서비스'를 활용신청한 뒤 .env.local에 키를 넣어주세요.",
    );
  }
  return key;
}

/** 초단기실황 base_date(YYYYMMDD) / base_time(HHmm)을 KST 기준으로 계산합니다. */
function resolveBaseDateTime(now: Date): { baseDate: string; baseTime: string } {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  let hour = kst.getUTCHours();
  const minute = kst.getUTCMinutes();

  // 발표 이후 여유(5분)를 두고, 40분 전이면 직전 시각 데이터를 사용
  if (minute < 45) {
    if (hour === 0) {
      kst.setUTCDate(kst.getUTCDate() - 1);
      hour = 23;
    } else {
      hour -= 1;
    }
  }

  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");

  return {
    baseDate: `${yyyy}${mm}${dd}`,
    baseTime: `${String(hour).padStart(2, "0")}00`,
  };
}

function mapPrecipitationType(code: string): PrecipitationType {
  switch (code) {
    case "1":
      return "rain";
    case "2":
      return "rain-snow";
    case "3":
      return "snow";
    case "4":
      return "shower";
    default:
      return "none";
  }
}

export async function fetchCurrentWeather(
  location: { lat: number; lng: number },
  now: Date = new Date(),
): Promise<WeatherSummary> {
  const serviceKey = requireApiKey();
  const { nx, ny } = latLngToKmaGrid(location.lat, location.lng);
  const { baseDate, baseTime } = resolveBaseDateTime(now);
  const baseUrl = process.env.WEATHER_API_BASE_URL ?? DEFAULT_BASE_URL;

  const params = new URLSearchParams({
    numOfRows: "10",
    pageNo: "1",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  });

  const url = `${baseUrl}/getUltraSrtNcst?${params.toString()}&serviceKey=${serviceKey}`;

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 60 * 10 } });
  } catch {
    throw new WeatherApiError("기상청 API 요청 중 네트워크 오류가 발생했어요.");
  }

  if (!res.ok) {
    throw new WeatherApiError(`기상청 API 요청 실패 (HTTP ${res.status})`);
  }

  let body: KmaResponse;
  try {
    body = (await res.json()) as KmaResponse;
  } catch {
    throw new WeatherApiError(
      "기상청 API 응답을 JSON으로 해석하지 못했어요 (serviceKey 오류 등으로 XML 에러 응답이 왔을 수 있어요).",
    );
  }

  const { resultCode, resultMsg } = body.response.header;
  if (resultCode !== "00") {
    throw new WeatherApiError(`기상청 API 오류 (${resultCode}): ${resultMsg}`);
  }

  const rawItem = body.response.body?.items?.item;
  const items = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];
  const byCategory = new Map(items.map((item) => [item.category, item.obsrValue]));

  const temperature = Number(byCategory.get("T1H") ?? "NaN");
  const humidity = Number(byCategory.get("REH") ?? "NaN");
  const precipitationMm = Number(byCategory.get("RN1") ?? "0");
  const precipitationType = mapPrecipitationType(byCategory.get("PTY") ?? "0");

  if (Number.isNaN(temperature) || Number.isNaN(humidity)) {
    throw new WeatherApiError("기상청 API 응답에서 필요한 관측값을 찾지 못했어요.");
  }

  return {
    observedAt: new Date(now.getTime()).toISOString(),
    temperatureCelsius: temperature,
    humidityPercent: humidity,
    precipitationType,
    precipitationMm: Number.isNaN(precipitationMm) ? 0 : precipitationMm,
  };
}
