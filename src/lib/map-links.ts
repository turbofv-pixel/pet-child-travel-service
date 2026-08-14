import type { Spot } from "@/types";

/**
 * API 키 없이 쓸 수 있는 지도 웹 딥링크 헬퍼.
 * 네이버지도/티맵처럼 앱 실행이 필요한 것들은 src/lib/open-map-app.ts를 쓰고,
 * 여기 있는 건 순수 웹 링크(<a href>)로 열어도 되는 것들만 모아뒀습니다.
 */

export function kakaoMapViewUrl(spot: Spot): string {
  const name = encodeURIComponent(spot.name);
  return `https://map.kakao.com/link/map/${name},${spot.location.lat},${spot.location.lng}`;
}

/**
 * ⚠️ 카카오 자체 이슈로 안드로이드에서 이 링크가 앱으로 튕겼다가 바로
 * 닫히는 등 불안정하다는 보고가 많습니다
 * (https://devtalk.kakao.com/t/topic/141458). 그래서 목적지 이름을 담은
 * 이 링크는 새 탭(target=_blank)이 아니라 같은 탭에서 바로 이동하도록
 * 써야 하고, 그래도 안 되면 네이버지도/티맵/구글맵 버튼을 대안으로
 * 제공합니다.
 */
export function kakaoMapDirectionsUrl(spot: Spot): string {
  const name = encodeURIComponent(spot.name);
  return `https://map.kakao.com/link/to/${name},${spot.location.lat},${spot.location.lng}`;
}

export function googleMapsViewUrl(spot: Spot): string {
  return `https://www.google.com/maps/search/?api=1&query=${spot.location.lat},${spot.location.lng}`;
}

/** 앱 설치 여부와 상관없이 브라우저에서 바로 열리는 길찾기 링크. */
export function googleMapsDirectionsUrl(spot: Spot): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.location.lat},${spot.location.lng}`;
}
