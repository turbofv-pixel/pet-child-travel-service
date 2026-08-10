# 반려동물·어린이 동반여행 서비스

반려동물, 그리고 아이와 함께 갈만한 곳을 추천받고 캘린더로 관리하는 동반여행 플래너 서비스입니다.

## 개요

- **반려동물 동반여행 계획 서비스 + 캘린더**: 반려동물 입장이 가능한 펫프렌들리 업소 기준으로 여행 계획을 세워줌
- **어린이 동반여행 계획 서비스 + 캘린더**: 어린이와 함께하기 좋은 관광지 기준으로 여행 계획을 세워줌

## 핵심 기능

- 대략적인 위치와 일자를 지정하면 근처 가볼만한 곳을 추천
- 주요 관광지에 담긴 역사·문화 이야기를 들려주는 오디오 가이드
- 위치기반 스탬프 - 여행 계획 달성 시 리워드 제공
- 캘린더 연동을 통한 일정 관리
- 함께 여행하는 가족·친구를 초대해 캘린더 공유
- (검토 중) NH 계열사 연계 - 올원 모임통장 / 가족 여행 적금 / 반려동물 보험 연결 / 지역 농협·하나로마트 할인쿠폰

## 기술 스택

- **Next.js** (App Router, TypeScript, Tailwind CSS)
- 오픈API 연계 예정 (관광지/펫프렌들리 업소, 지도, 날씨) - 후보 목록은
  [`src/lib/open-api/README.md`](./src/lib/open-api/README.md) 참고

## 개발 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

오픈API 키가 필요하면 `.env.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.
`TOUR_API_KEY`를 채우면 `/plan`이 실시간 TourAPI 데이터를 쓰고, 비워두면 샘플 데이터로
동작합니다 (자세한 내용은 [`src/lib/open-api/README.md`](./src/lib/open-api/README.md)).

```bash
cp .env.example .env.local
```

## 프로젝트 구조

```
src/
  app/            # Next.js App Router 페이지
  types/          # 도메인 타입 (TravelPlan, Spot, Stamp, Reward ...)
  lib/open-api/    # 오픈API 연동 자리 (아직 클라이언트 미구현)
```

## 로드맵

- [x] 추천 엔진 뼈대 설계 (필터링 기준: 동반 유형 + 반경) - `src/lib/recommend.ts`, `/api/recommendations`, `/plan` 페이지
- [x] 관광지·펫프렌들리 업소 오픈API 연동 (TourAPI, 키 없으면 샘플 데이터로 폴백) - `src/lib/open-api/tour-api.ts`
- [ ] 캘린더 연동 (일정 등록/공유)
- [ ] 위치기반 스탬프 & 리워드 로직
- [ ] NH 계열사 연계 항목 검토

관련 기획 배경은 블로그 글에도 정리해두었습니다:
[반려동물·어린이 동반여행 서비스 기획기](https://turbofv-pixel.github.io/Blog/)
