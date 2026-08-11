/**
 * 위경도 → 기상청 격자(nx, ny) 변환.
 *
 * 기상청 단기예보/초단기실황 API는 위경도가 아니라 5km 간격의
 * Lambert Conformal Conic(LCC) 격자 좌표(nx, ny)를 요구합니다. 아래 상수와
 * 변환식은 기상청이 배포하는 격자변환 프로그램(dfs_xy_conv) 기준으로,
 * 국내 기상청 API 연동 예제에서 널리 쓰이는 공식입니다.
 */

const DEG_TO_RAD = Math.PI / 180.0;

const RE = 6371.00877; // 지도반경 (km)
const GRID = 5.0; // 격자간격 (km)
const SLAT1 = 30.0 * DEG_TO_RAD; // 투영위도1
const SLAT2 = 60.0 * DEG_TO_RAD; // 투영위도2
const OLON = 126.0 * DEG_TO_RAD; // 기준점 경도
const OLAT = 38.0 * DEG_TO_RAD; // 기준점 위도
const XO = 43; // 기준점 X좌표 (GRID 단위)
const YO = 136; // 기준점 Y좌표 (GRID 단위)

export interface KmaGrid {
  nx: number;
  ny: number;
}

export function latLngToKmaGrid(lat: number, lng: number): KmaGrid {
  const re = RE / GRID;

  let sn =
    Math.tan(Math.PI * 0.25 + SLAT2 * 0.5) /
    Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  sn = Math.log(Math.cos(SLAT1) / Math.cos(SLAT2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(SLAT1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + OLAT * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEG_TO_RAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = lng * DEG_TO_RAD - OLON;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}
