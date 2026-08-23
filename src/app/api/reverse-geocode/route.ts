import { NextRequest, NextResponse } from "next/server";
import { GeocodeApiError, reverseGeocodeWithFallback } from "@/lib/open-api/geocode-api";

/** GET /api/reverse-geocode?lat=37.5&lng=127.0 */
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

  try {
    const { address, source } = await reverseGeocodeWithFallback(lat, lng);
    return NextResponse.json({ address, source });
  } catch (error) {
    const message =
      error instanceof GeocodeApiError
        ? error.message
        : "역지오코딩 중 알 수 없는 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
