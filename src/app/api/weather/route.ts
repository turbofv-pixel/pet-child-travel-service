import { NextRequest, NextResponse } from "next/server";
import { getWeatherWithFallback } from "@/lib/weather";

/** GET /api/weather?lat=37.5&lng=127.0 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat, lng 파라미터가 필요합니다 (숫자)." },
      { status: 400 },
    );
  }

  const result = await getWeatherWithFallback({ lat, lng });
  return NextResponse.json(result);
}
