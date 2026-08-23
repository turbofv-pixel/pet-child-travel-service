# 오픈API 연동

| 목적 | API | 상태 |
| --- | --- | --- |
| 관광지 정보 (어린이 동반) | 한국관광공사 TourAPI `KorService2/locationBasedList2` | ✅ `tour-api.ts`에 연동됨 |
| 펫프렌들리 업소 정보 (반려동물 동반) | 한국관광공사 TourAPI `KorService2/detailPetTour2` (상세조회) | ✅ `tour-api.ts`에 연동됨 (아래 참고 - 별도 상품이 아님) |
| 날씨 | 기상청 단기예보 `getUltraSrtNcst` (초단기실황) | ✅ `weather-api.ts`에 연동됨 |
| 지도 / 경로 안내 | 카카오맵 웹 딥링크 + 네이버지도/티맵 앱 딥링크 + 구글맵 | ✅ `map-links.ts`, `open-map-app.ts` |
| 주소/장소명 검색 (지오코딩) | 카카오 로컬 API → (키 없으면) OSM Nominatim | ✅ `geocode-api.ts`, `/api/geocode` |

API 키는 절대 커밋하지 말고 `.env.local`에 두세요 (`.env.example` 참고).

## TourAPI 사용법

1. [data.go.kr](https://www.data.go.kr)에서 "한국관광공사_국문 관광정보 서비스"를 활용신청 (자동승인)
2. 발급받은 서비스키를 `.env.local`의 `TOUR_API_KEY`에 넣기
3. `recommendSpotsWithFallback()` (`src/lib/recommend.ts`)이 키 유무를 감지해서
   - 키가 있으면 실시간 TourAPI 호출
   - 키가 없거나 호출이 실패하면 `src/data/spots.sample.ts` 샘플 데이터로 자동 폴백

`/api/recommendations` 응답의 `source` 필드로 `"live"`/`"sample"` 여부를 확인할 수 있고,
`/plan` 페이지에도 뱃지로 표시됩니다.

### 반려동물 동반 추천은 어떻게 동작하나요

처음엔 "반려동물 동반여행 서비스"라는 별도 API 상품이 있다고 가정하고 만들었는데,
실제로 신청해보니 그런 상품 자체가 없었어요 (`NO_OPENAPI_SERVICE_ERROR`). TourAPI는
반려동물 동반 정보를 별도 검색 엔드포인트가 아니라, 이미 활용신청한 **같은
KorService2 안의 상세조회 오퍼레이션(`detailPetTour2`)**으로 `contentId`별로 제공합니다.

그래서 `fetchNearbyPetFriendlySpots()`는:

1. 일반 위치기반 조회(`locationBasedList2`)로 주변 후보를 가져오고
2. 후보마다(최대 `MAX_PET_DETAIL_LOOKUPS`개) `detailPetTour2`를 호출해서 반려동물
   동반 상세정보가 등록돼 있는지 확인하고
3. 정보가 있는 곳만 추천 결과에 포함시킵니다.

후보 수만큼 상세조회 API를 추가로 호출하는 구조라, 반경/후보 수가 늘어나면 응답이
느려질 수 있어요. `detailPetTour2` 응답 필드 구조(반려동물 크기 제한 등 세부 정보)는
아직 안 읽고 "정보 존재 여부"만 보는데, 이후 상세 조건까지 반영하려면 실제 응답을
보고 필드를 확인해서 다듬어야 해요.

## 기상청 날씨 API 사용법

1. [data.go.kr](https://www.data.go.kr)에서 "기상청_단기예보 ((구)_동네예보) 조회서비스"를 활용신청 (자동승인)
2. 발급받은 서비스키를 `.env.local`의 `WEATHER_API_KEY`에 넣기
3. `getWeatherWithFallback()` (`src/lib/weather.ts`)이 키 유무를 감지해서
   - 키가 있으면 실시간 초단기실황(`getUltraSrtNcst`) 호출
   - 키가 없거나 호출이 실패하면 **샘플 값으로 대체하지 않고** `weather: null`을 반환
     (날씨는 그럴듯한 가짜 값을 보여주면 오히려 오해를 줄 수 있어서, 관광지 추천과는
     다르게 그냥 표시를 생략하는 쪽을 택했습니다)

위경도 → 기상청 격자(nx, ny) 변환은 `kma-grid.ts`에 있고, 기상청이 배포하는
격자변환 공식(LCC 투영)을 그대로 옮긴 것입니다.

## 지도 딥링크

`map-links.ts`는 API 키 없이도 쓸 수 있는 카카오맵 웹 딥링크(`map.kakao.com/link/map/...`,
`map.kakao.com/link/to/...`)로 "지도에서 보기"/"길찾기"를 지원합니다. 지도를 페이지 안에
직접 그리는 SDK 임베드(카카오맵 JS SDK 등)는 아직 미착수예요.

## 지오코딩 (장소명 → 좌표) 사용법

`/plan`의 위치 검색창은 `/api/geocode`를 호출합니다.

- `KAKAO_REST_API_KEY`가 있으면 카카오 로컬 API로 검색 (정확도 좋음, 카카오맵 JS
  키와는 다른 "REST API 키"를 써야 해요 - 카카오 개발자 콘솔에서 발급)
- 없으면 키가 필요 없는 OpenStreetMap Nominatim으로 자동 대체 (정확도는 다소 낮고,
  초당 요청 제한 등 사용 정책이 있음)

## 앞으로 할 일

- [x] TourAPI 응답을 `src/types`의 `Spot` 모델로 매핑하는 어댑터 (`toSpot`)
- [x] 키 없음/호출 실패 시 샘플 데이터로 폴백
- [x] 기상청 날씨 API 연동 (위경도 → 격자 변환 포함)
- [x] 지도 딥링크 (지도에서 보기 / 길찾기 - 카카오·네이버·티맵·구글)
- [x] 지오코딩 (장소명/주소 검색)
- [x] 반려동물 동반 정보 연동 (`detailPetTour2` 상세조회 기반으로 수정)
- [ ] `detailPetTour2` 응답 필드(반려동물 크기 제한 등)를 실제로 파싱해서 활용
- [ ] 상세조회(`detailIntro2` 등) 연동해서 오디오 가이드 보유 여부 등 채우기
- [ ] 지도 SDK 임베드 (페이지 안에 실제 지도 렌더링)
- [ ] 요청 실패/레이트리밋 처리 공통 유틸, 응답 캐싱 정책 다듬기
