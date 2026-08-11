import type { Coordinates, WeatherSummary } from "@/types";
import { WeatherApiError, fetchCurrentWeather } from "./open-api/weather-api";

export interface WeatherResult {
  weather: WeatherSummary | null;
  source: "live" | "unavailable";
  warning?: string;
}

/**
 * 날씨는 추천 스팟과 달리 "그럴듯한 샘플 값"을 보여주면 오히려 오해를 줄 수
 * 있어서, 실패 시 샘플로 대체하지 않고 그냥 비어있는 상태로 둡니다.
 */
export async function getWeatherWithFallback(
  location: Coordinates,
): Promise<WeatherResult> {
  if (!process.env.WEATHER_API_KEY) {
    return { weather: null, source: "unavailable" };
  }

  try {
    return { weather: await fetchCurrentWeather(location), source: "live" };
  } catch (error) {
    return {
      weather: null,
      source: "unavailable",
      warning:
        error instanceof WeatherApiError
          ? error.message
          : "기상청 API 호출 중 알 수 없는 오류가 발생했어요.",
    };
  }
}
