import { NextRequest, NextResponse } from "next/server";
import { GeocodeApiError, geocodeWithFallback } from "@/lib/open-api/geocode-api";

/** GET /api/geocode?query=시흥시청 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const { results, source } = await geocodeWithFallback(query);
    return NextResponse.json({ results, source });
  } catch (error) {
    const message =
      error instanceof GeocodeApiError
        ? error.message
        : "위치 검색 중 알 수 없는 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
