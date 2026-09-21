import { NextRequest, NextResponse } from "next/server";
import { TourApiError, fetchSpotOverview } from "@/lib/open-api/tour-api";

/**
 * GET /api/spot-overview?contentId=126508
 * 오디오 가이드용 관광지 소개 텍스트. TOUR_API_KEY가 없거나 이 contentId에
 * 등록된 소개글이 없으면 overview: null을 반환합니다 (오류가 아니라 정상적인
 * "가이드 없음" 상태로 취급).
 */
export async function GET(request: NextRequest) {
  const contentId = request.nextUrl.searchParams.get("contentId")?.trim();

  if (!contentId) {
    return NextResponse.json({ error: "contentId 파라미터가 필요합니다." }, { status: 400 });
  }

  if (!process.env.TOUR_API_KEY) {
    return NextResponse.json({ overview: null, reason: "no-api-key" });
  }

  try {
    const overview = await fetchSpotOverview(contentId);
    return NextResponse.json({ overview });
  } catch (error) {
    const message =
      error instanceof TourApiError
        ? error.message
        : "소개글을 불러오는 중 알 수 없는 오류가 발생했어요.";
    return NextResponse.json({ overview: null, warning: message });
  }
}
