import type { Spot } from "@/types";

/**
 * 지도 오픈API(SDK) 연동 전까지 쓰는 딥링크 헬퍼.
 * 카카오맵/구글맵은 API 키 없이도 쓸 수 있는 웹 딥링크 스킴을 제공해서,
 * "지도에서 보기 / 길찾기"는 이 방식으로 먼저 지원합니다.
 */

export function kakaoMapViewUrl(spot: Spot): string {
  const name = encodeURIComponent(spot.name);
  return `https://map.kakao.com/link/map/${name},${spot.location.lat},${spot.location.lng}`;
}

export function kakaoMapDirectionsUrl(spot: Spot): string {
  const name = encodeURIComponent(spot.name);
  return `https://map.kakao.com/link/to/${name},${spot.location.lat},${spot.location.lng}`;
}

export function googleMapsViewUrl(spot: Spot): string {
  return `https://www.google.com/maps/search/?api=1&query=${spot.location.lat},${spot.location.lng}`;
}
