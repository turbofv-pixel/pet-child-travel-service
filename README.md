# 반려동물·어린이 동반여행 서비스

반려동물, 그리고 아이와 함께 갈만한 곳을 추천받고 캘린더로 관리하는 동반여행 플래너 서비스입니다.

**배포:** https://pet-child-travel-service.vercel.app (Vercel, `main` 브랜치 자동 배포)

## 개요

- **반려동물 동반여행 계획 서비스 + 캘린더**: 반려동물 입장이 가능한 펫프렌들리 업소 기준으로 여행 계획을 세워줌
- **어린이 동반여행 계획 서비스 + 캘린더**: 어린이와 함께하기 좋은 관광지 기준으로 여행 계획을 세워줌

## 핵심 기능

- 위치 입력 - 현재 위치 자동 감지(역지오코딩으로 실제 주소 표시), 장소명/주소 검색, 빠른 프리셋 중 선택
- 검색 반경을 5/10/15/20/50/100km 중에서 선택 (±버튼으로도 조절)
- 위치와 일자를 지정하면 근처 가볼만한 곳을 추천 (`/plan`), 목록보기/지도보기 전환 가능
- 추천 지역의 현재 날씨 표시 (기상청 오픈API)
- 지도에서 보기 / 길찾기 딥링크 (카카오·네이버·티맵·구글)
- 오디오 가이드 - TourAPI 상세조회(`detailCommon2`)로 가져온 소개글을 브라우저
  내장 음성합성(Web Speech API)으로 직접 읽어줌 (재생/일시정지/이어듣기, 별도
  TTS 키 불필요). 소개글이 없는 스팟(카카오/샘플 데이터 원본)은 안내 문구로
  표시, 음성 재생이 안 되는 기기/브라우저에서는 글로 대체해서 읽을 수 있음
- 로그인(이메일/비밀번호) - 로그인하면 여행 계획·스탬프·리워드가 기기와 상관없이 계정에 저장됨
- 추천받은 곳을 골라 여행 계획으로 저장, 캘린더에서 확인 (`/calendar`)
- 위치기반 체크인(스탬프) - 브라우저 위치 정보로 여행지 근처(500m 이내)인지
  확인해서 스탬프 적립, 계획을 다 채우면 리워드 지급 (`/calendar/[id]`)
- 리워드 코드 + 갤러리 - 리워드를 받으면 `PETRIP-XXXXXX` 형태의 교환 코드가
  발급되고, `/rewards`에서 지금까지 받은 리워드를 코드 복사 버튼과 함께 한눈에
  모아볼 수 있음 (제휴처 교환은 검토 중, 코드 발급 구조만 우선 구현)
- (검토 중) NH 계열사 연계 - 올원 모임통장 / 가족 여행 적금 / 반려동물 보험 연결 / 지역 농협·하나로마트 할인쿠폰 (위 리워드 코드로 교환)

## 기술 스택

- **Next.js** (App Router, TypeScript, Tailwind CSS)
- 오픈API 연동 - 관광지/펫프렌들리 업소(TourAPI), 날씨(기상청), 지오코딩(카카오
  로컬/Nominatim), 지도(카카오·네이버·티맵·구글 딥링크). 자세한 내용은
  [`src/lib/open-api/README.md`](./src/lib/open-api/README.md) 참고
- **Supabase** - 로그인(이메일/비밀번호)과 Postgres DB. 설정 안 돼 있으면
  로그인 기능이 자동으로 숨겨지고, 여행 계획/스탬프/리워드는 기기별
  `localStorage`로 조용히 폴백됩니다 (앱이 깨지지 않음) - `src/lib/supabase/`,
  `src/lib/data/`, [`supabase/schema.sql`](./supabase/schema.sql)

## 개발 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

오픈API/Supabase 키가 필요하면 `.env.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

- `TOUR_API_KEY`/`WEATHER_API_KEY`를 채우면 실시간 데이터를 쓰고, 비워두면 각각 샘플
  데이터 / "날씨 정보 없음"으로 동작합니다 (자세한 내용은
  [`src/lib/open-api/README.md`](./src/lib/open-api/README.md)).
- `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`를 채우면 로그인 +
  DB 저장이 활성화됩니다. Supabase 프로젝트를 새로 만들었다면, 대시보드의
  **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 내용을 한
  번 실행해서 테이블(`travel_plans`, `stamps`, `rewards`)과 RLS 정책을
  만들어줘야 해요.

## 프로젝트 구조

```
src/
  app/                 # Next.js App Router 페이지 (/, /plan, /calendar, /calendar/[id], /login, /rewards)
  app/api/spot-overview/ # TourAPI 상세조회(detailCommon2) 소개글 조회 API (오디오 가이드용)
  types/                # 도메인 타입 (TravelPlan, Spot, Stamp, Reward, WeatherSummary ...)
  lib/open-api/         # 오픈API 클라이언트 (TourAPI, 기상청, 지오코딩)
  lib/reward-code.ts     # 리워드 교환 코드 생성 (PETRIP-XXXXXX)
  components/AudioGuideButton.tsx # 오디오 가이드 재생 버튼 (Web Speech API)
  lib/supabase/          # Supabase 클라이언트(브라우저/서버/미들웨어) + 로그인 상태 훅
  lib/data/               # 여행 계획/스탬프/리워드 - Supabase ↔ localStorage 자동 전환
  lib/storage/            # localStorage 구현체 (lib/data의 폴백 대상)
  lib/recommend.ts        # 추천 엔진 (오픈API ↔ 샘플 데이터 폴백)
  lib/weather.ts          # 날씨 조회 (오픈API ↔ 미제공 폴백)
  lib/map-links.ts         # 지도 웹 딥링크 (카카오맵, 구글맵)
  lib/open-map-app.ts       # 지도 앱 딥링크 (네이버지도, 티맵 - 안드로이드 intent / iOS 스킴)
  components/MapView.tsx     # 추천 결과 지도보기 (Leaflet + OpenStreetMap, 키 불필요)
supabase/
  schema.sql             # DB 테이블 + RLS 정책 (Supabase SQL Editor에서 1회 실행)
```

## 로드맵

- [x] 추천 엔진 뼈대 설계 (필터링 기준: 동반 유형 + 반경) - `src/lib/recommend.ts`, `/api/recommendations`, `/plan` 페이지
- [x] 관광지·펫프렌들리 업소 오픈API 연동 (TourAPI, 키 없으면 샘플 데이터로 폴백) - `src/lib/open-api/tour-api.ts`
- [x] 날씨 오픈API 연동 (기상청 초단기실황, 키 없으면 표시 생략) - `src/lib/open-api/weather-api.ts`
- [x] 지도 딥링크 (카카오·네이버·티맵·구글) - `src/lib/map-links.ts`, `src/lib/open-map-app.ts`
- [x] 위치 검색/현위치 감지(역지오코딩 포함) + 반경 프리셋 - `src/components/LocationPicker.tsx`, `RadiusStepper.tsx`, `/api/geocode`, `/api/reverse-geocode`
- [x] 추천 결과 목록보기/지도보기 전환 - `src/components/MapView.tsx` (Leaflet, API 키 불필요)
- [x] 캘린더 연동 (여행 계획 저장 + 월별 캘린더 뷰) - `/calendar`, `/calendar/[id]`
- [x] 위치기반 스탬프 & 리워드 로직 (브라우저 Geolocation 기반 체크인) - `/calendar/[id]`
- [x] 로그인(이메일/비밀번호) + DB 저장 (Supabase) - `/login`, `src/lib/supabase/`, `src/lib/data/`
- [ ] 캘린더 공유 (동행자 초대) - 현재 `TravelPlan.companionUserIds`는 항상 빈 배열
- [ ] `detailPetTour2` 응답 필드(반려동물 크기 제한 등)를 실제로 파싱해서 활용
- [ ] NH 계열사 연계 항목 검토

관련 기획 배경은 블로그 글에도 정리해두었습니다:
[반려동물·어린이 동반여행 서비스 기획기](https://turbofv-pixel.github.io/Blog/)
