# 오픈API 연동

| 목적 | API | 상태 |
| --- | --- | --- |
| 관광지 정보 (어린이 동반) | 한국관광공사 TourAPI `KorService2/locationBasedList2` | ✅ `tour-api.ts`에 연동됨 |
| 펫프렌들리 업소 정보 (반려동물 동반) | 한국관광공사 "반려동물 동반여행 서비스" | ✅ `tour-api.ts`에 연동됨 (엔드포인트 경로는 검증 필요, 아래 참고) |
| 지도 / 경로 안내 | 지도 오픈API (Kakao/Naver 지도 등 후보) | 미착수, 인증키 필요 |
| 날씨 | 기상청 오픈API (단기예보) | 미착수, 인증키 필요 |

API 키는 절대 커밋하지 말고 `.env.local`에 두세요 (`.env.example` 참고).

## TourAPI 사용법

1. [data.go.kr](https://www.data.go.kr)에서 "한국관광공사_국문 관광정보 서비스"를 활용신청 (자동승인)
2. 발급받은 서비스키를 `.env.local`의 `TOUR_API_KEY`에 넣기
3. `recommendSpotsWithFallback()` (`src/lib/recommend.ts`)이 키 유무를 감지해서
   - 키가 있으면 실시간 TourAPI 호출
   - 키가 없거나 호출이 실패하면 `src/data/spots.sample.ts` 샘플 데이터로 자동 폴백

`/api/recommendations` 응답의 `source` 필드로 `"live"`/`"sample"` 여부를 확인할 수 있고,
`/plan` 페이지에도 뱃지로 표시됩니다.

### ⚠️ 반려동물 동반여행 서비스 엔드포인트 검증 필요

`fetchNearbyPetFriendlySpots()`가 호출하는 `KorPetTourService1/locationBasedList1`은
공개 문서를 참고한 최선의 추정 경로입니다. data.go.kr에서 실제 활용신청한 서비스의
활용가이드 문서를 열어서 정확한 base URL/엔드포인트 이름을 확인하고, 다르면
`.env.local`의 `TOUR_PET_API_BASE_URL`로 덮어써주세요.

## 앞으로 할 일

- [x] TourAPI 응답을 `src/types`의 `Spot` 모델로 매핑하는 어댑터 (`toSpot`)
- [x] 키 없음/호출 실패 시 샘플 데이터로 폴백
- [ ] 반려동물 동반여행 서비스 엔드포인트 실제 키로 검증
- [ ] 상세조회(`detailIntro2` 등) 연동해서 오디오 가이드 보유 여부 등 채우기
- [ ] 지도 / 날씨 오픈API 연동
- [ ] 요청 실패/레이트리밋 처리 공통 유틸, 응답 캐싱 정책 다듬기
