# 반려동물·어린이 동반여행 서비스

반려동물, 그리고 아이와 함께 갈만한 곳을 추천받고 캘린더로 관리하는 동반여행 플래너 서비스입니다.

**배포:** https://pet-child-travel-service.vercel.app (Vercel, `main` 브랜치 자동 배포)

## 개요

- **반려동물 동반여행 계획 서비스 + 캘린더**: 반려동물 입장이 가능한 펫프렌들리 업소 기준으로 여행 계획을 세워줌
- **어린이 동반여행 계획 서비스 + 캘린더**: 어린이와 함께하기 좋은 관광지 기준으로 여행 계획을 세워줌

## 핵심 기능

- 대략적인 위치와 일자를 지정하면 근처 가볼만한 곳을 추천 (`/plan`)
- 추천 지역의 현재 날씨 표시 (기상청 오픈API)
- 지도에서 보기 / 길찾기 딥링크 (카카오맵)
- 주요 관광지에 담긴 역사·문화 이야기를 들려주는 오디오 가이드 표시
- 추천받은 곳을 골라 여행 계획으로 저장, 캘린더에서 확인 (`/calendar`)
- 위치기반 체크인(스탬프) - 브라우저 위치 정보로 여행지 근처(500m 이내)인지
  확인해서 스탬프 적립, 계획을 다 채우면 리워드 지급 (`/calendar/[id]`)
- (검토 중) NH 계열사 연계 - 올원 모임통장 / 가족 여행 적금 / 반려동물 보험 연결 / 지역 농협·하나로마트 할인쿠폰

## 기술 스택

- **Next.js** (App Router, TypeScript, Tailwind CSS)
- 오픈API 연동 - 관광지/펫프렌들리 업소(TourAPI), 날씨(기상청), 지도(카카오맵 딥링크).
  자세한 내용은 [`src/lib/open-api/README.md`](./src/lib/open-api/README.md) 참고
- 여행 계획/스탬프/리워드는 아직 백엔드 DB 없이 브라우저 `localStorage`에 저장 (기기별로 따로 저장됨)

## 개발 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

오픈API 키가 필요하면 `.env.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.
`TOUR_API_KEY`/`WEATHER_API_KEY`를 채우면 실시간 데이터를 쓰고, 비워두면 각각 샘플
데이터 / "날씨 정보 없음"으로 동작합니다 (자세한 내용은
[`src/lib/open-api/README.md`](./src/lib/open-api/README.md)).

```bash
cp .env.example .env.local
```

## 프로젝트 구조

```
src/
  app/                # Next.js App Router 페이지 (/, /plan, /calendar, /calendar/[id])
  types/               # 도메인 타입 (TravelPlan, Spot, Stamp, Reward, WeatherSummary ...)
  lib/open-api/        # 오픈API 클라이언트 (TourAPI, 기상청)
  lib/storage/          # localStorage 기반 여행 계획/스탬프/리워드 저장소
  lib/recommend.ts      # 추천 엔진 (오픈API ↔ 샘플 데이터 폴백)
  lib/weather.ts        # 날씨 조회 (오픈API ↔ 미제공 폴백)
  lib/map-links.ts       # 지도 딥링크 (카카오맵)
```

## 로드맵

- [x] 추천 엔진 뼈대 설계 (필터링 기준: 동반 유형 + 반경) - `src/lib/recommend.ts`, `/api/recommendations`, `/plan` 페이지
- [x] 관광지·펫프렌들리 업소 오픈API 연동 (TourAPI, 키 없으면 샘플 데이터로 폴백) - `src/lib/open-api/tour-api.ts`
- [x] 날씨 오픈API 연동 (기상청 초단기실황, 키 없으면 표시 생략) - `src/lib/open-api/weather-api.ts`
- [x] 지도 딥링크 (카카오맵 "지도에서 보기" / "길찾기") - `src/lib/map-links.ts`
- [x] 캘린더 연동 (여행 계획 저장 + 월별 캘린더 뷰) - `/calendar`, `/calendar/[id]`
- [x] 위치기반 스탬프 & 리워드 로직 (브라우저 Geolocation 기반 체크인) - `/calendar/[id]`
- [ ] 캘린더 공유 (동행자 초대) - 현재 `TravelPlan.companionUserIds`는 항상 빈 배열
- [ ] 여행 계획/스탬프/리워드를 서버 DB로 이전 (지금은 기기별 localStorage)
- [ ] 반려동물 동반여행 서비스 엔드포인트 실제 키로 검증
- [ ] NH 계열사 연계 항목 검토

관련 기획 배경은 블로그 글에도 정리해두었습니다:
[반려동물·어린이 동반여행 서비스 기획기](https://turbofv-pixel.github.io/Blog/)
