import { NextRequest, NextResponse } from "next/server";
import type { CompanionType } from "@/types";
import { recommendSpotsWithFallback } from "@/lib/recommend";

const VALID_COMPANION_TYPES: CompanionType[] = ["pet", "child"];

function isCompanionType(value: string | null): value is CompanionType {
  return VALID_COMPANION_TYPES.includes(value as CompanionType);
}

/**
 * GET /api/recommendations?companionType=pet&lat=37.5&lng=127.0&radiusKm=50
 *
 * 위치·동반 유형을 기준으로 추천 여행지 목록을 반환합니다.
 * 아직 샘플 데이터 기반이며, 실제 오픈API 연동 후 데이터 소스만
 * 교체하면 됩니다 (src/lib/recommend.ts 참고).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const companionType = params.get("companionType");
  const lat = params.get("lat");
  const lng = params.get("lng");
  const radiusKmParam = params.get("radiusKm");
  const date = params.get("date") ?? undefined;

  if (!isCompanionType(companionType)) {
    return NextResponse.json(
      {
        error:
          "companionType 파라미터가 필요합니다 ('pet' 또는 'child' 중 하나).",
      },
      { status: 400 },
    );
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (lat === null || lng === null || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: "lat, lng 파라미터가 필요합니다 (숫자)." },
      { status: 400 },
    );
  }

  const radiusKm = radiusKmParam !== null ? Number(radiusKmParam) : undefined;

  if (radiusKm !== undefined && (Number.isNaN(radiusKm) || radiusKm <= 0)) {
    return NextResponse.json(
      { error: "radiusKm은 0보다 큰 숫자여야 합니다." },
      { status: 400 },
    );
  }

  const result = await recommendSpotsWithFallback({
    companionType,
    location: { lat: latNum, lng: lngNum },
    radiusKm,
    date,
  });

  return NextResponse.json(result);
}
