"use client";

import type { Spot } from "@/types";

/**
 * 카카오맵/구글맵과 달리 네이버지도·티맵은 앱이 없으면 웹에서 길찾기를
 * 제대로 보여줄 방법이 마땅치 않아서, 커스텀 URL 스킴으로 앱을 직접
 * 실행시키는 방식을 씁니다.
 *
 * - 안드로이드: Chrome이 공식 지원하는 `intent://...#Intent;package=...;end`
 *   포맷을 쓰면, 앱이 있으면 바로 열리고 없으면 지정한 스토어 링크로 자동
 *   대체됩니다. (https://developer.chrome.com/docs/android/intents)
 * - iOS: 브라우저가 커스텀 스킴 실행 성공/실패를 알려주지 않기 때문에,
 *   스킴으로 이동을 시도해보고 일정 시간 안에 화면이 전환되지 않으면(=앱이
 *   없으면) 대체 링크로 이동하는 타임아웃 트릭을 씁니다.
 *
 * URL 생성(순수 함수)과 실제 이동(부수효과)을 분리해뒀습니다 - 생성 로직은
 * DOM 없이도 테스트할 수 있어요.
 */

const NAVER_MAP_ANDROID_PACKAGE = "com.nhn.android.nmap";
const NAVER_MAP_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${NAVER_MAP_ANDROID_PACKAGE}`;

const TMAP_ANDROID_PACKAGE = "com.skt.tmap.ku";
const TMAP_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${TMAP_ANDROID_PACKAGE}`;

export interface NaverMapDirectionsUrls {
  androidIntentUrl: string;
  iosScheme: string;
  webFallback: string;
}

export function buildNaverMapDirectionsUrls(
  spot: Spot,
  appOrigin: string,
): NaverMapDirectionsUrls {
  const name = encodeURIComponent(spot.name);
  const appname = encodeURIComponent(appOrigin);
  const params = `dlat=${spot.location.lat}&dlng=${spot.location.lng}&dname=${name}&appname=${appname}`;

  return {
    androidIntentUrl:
      `intent://navigation?${params}` +
      `#Intent;scheme=nmap;package=${NAVER_MAP_ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(NAVER_MAP_PLAY_STORE_URL)};end`,
    iosScheme: `nmap://navigation?${params}`,
    // 네이버지도 웹사이트에는 좌표 기반 길찾기 딥링크가 마땅치 않아,
    // 스킴이 실패하면 장소 검색 결과로라도 보내줍니다.
    webFallback: `https://map.naver.com/p/search/${name}`,
  };
}

export interface TmapDirectionsUrls {
  androidIntentUrl: string;
  iosScheme: string;
  /** 티맵은 자체 웹 길찾기가 없어서, 스킴이 실패하면 구글맵으로 보냅니다. */
  fallback: string;
}

export function buildTmapDirectionsUrls(spot: Spot): TmapDirectionsUrls {
  const name = encodeURIComponent(spot.name);

  return {
    androidIntentUrl:
      `intent://route?goalx=${spot.location.lng}&goaly=${spot.location.lat}&goalname=${name}` +
      `#Intent;scheme=tmap;package=${TMAP_ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(TMAP_PLAY_STORE_URL)};end`,
    iosScheme: `tmap://route?rGoX=${spot.location.lng}&rGoY=${spot.location.lat}&rGoName=${name}`,
    fallback: `https://www.google.com/maps/dir/?api=1&destination=${spot.location.lat},${spot.location.lng}`,
  };
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function tryOpenSchemeThenFallback(scheme: string, fallbackUrl: string) {
  let appOpened = false;
  const onVisibilityChange = () => {
    if (document.hidden) appOpened = true;
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  window.location.href = scheme;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (!appOpened) {
      window.location.href = fallbackUrl;
    }
  }, 1500);
}

export function openNaverMapDirections(spot: Spot) {
  const urls = buildNaverMapDirectionsUrls(spot, window.location.origin);

  if (isAndroid()) {
    window.location.href = urls.androidIntentUrl;
  } else if (isIOS()) {
    tryOpenSchemeThenFallback(urls.iosScheme, urls.webFallback);
  } else {
    window.location.href = urls.webFallback;
  }
}

export function openTmapDirections(spot: Spot) {
  const urls = buildTmapDirectionsUrls(spot);

  if (isAndroid()) {
    window.location.href = urls.androidIntentUrl;
  } else if (isIOS()) {
    tryOpenSchemeThenFallback(urls.iosScheme, urls.fallback);
  } else {
    window.location.href = urls.fallback;
  }
}
