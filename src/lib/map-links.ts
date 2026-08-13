import type { Spot } from "@/types";

/**
 * 지도 오픈API(SDK) 연동 전까지 쓰는 딥링크 헬퍼.
 * "지도에서 보기"는 카카오맵으로, "길찾기"는 구글맵으로 보냅니다 - 이유는
 * 아래 kakaoMapDirectionsUrl 주석 참고.
 */

export function kakaoMapViewUrl(spot: Spot): string {
  const name = encodeURIComponent(spot.name);
  return `https://map.kakao.com/link/map/${name},${spot.location.lat},${spot.location.lng}`;
}

/**
 * ⚠️ 길찾기용으로 쓰지 마세요.
 * `map.kakao.com/link/to/...`는 카카오맵 "앱"으로의 딥링크라서, 앱이 설치돼
 * 있지 않은 브라우저(데스크톱, 카카오맵 미설치 폰)에서는 아무 반응이 없거나
 * 앱스토어로만 튕겨서 실제로 길찾기가 안 되는 것처럼 보입니다.
 * 길찾기는 googleMapsDirectionsUrl을 쓰세요 - 구글맵은 앱이 없어도 웹에서
 * 그대로 열립니다.
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
