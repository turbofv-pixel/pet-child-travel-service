/**
 * 도메인 타입 초안
 *
 * 기획 단계에서 정리한 핵심 개념들을 코드로 옮겨둔 초기 스켈레톤입니다.
 * 실제 오픈API 연동 스펙이 정해지면 필드가 계속 바뀔 수 있어요.
 */

/** 추천 대상 기준 - 반려동물 동반 / 어린이 동반 */
export type CompanionType = "pet" | "child";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** 추천된 여행지 하나 (펫프렌들리 업소 or 어린이 동반 관광지) */
export interface Spot {
  id: string;
  name: string;
  companionType: CompanionType;
  /** 오픈API(TourAPI, 공공데이터포털 등) 원본 데이터의 출처 식별자 */
  sourceId: string;
  address: string;
  location: Coordinates;
  /** 오디오 가이드가 준비된 관광지인지 여부 */
  hasAudioGuide: boolean;
}

/** 사용자가 세운 여행 계획 - 여러 Spot과 일정을 묶은 단위 */
export interface TravelPlan {
  id: string;
  title: string;
  companionType: CompanionType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  spots: Spot[];
  /** 캘린더와 연동되는 이벤트 ID (연동 전에는 비어있을 수 있음) */
  calendarEventId?: string;
  /** 함께 여행하는 동행자 (초대된 사용자 ID 목록) */
  companionUserIds: string[];
}

/** 위치기반 스탬프 - 여행지 도착 시 적립 */
export interface Stamp {
  id: string;
  spotId: string;
  travelPlanId: string;
  earnedAt: string; // ISO datetime
}

/** 여행 계획 달성 시 지급되는 리워드 */
export interface Reward {
  id: string;
  travelPlanId: string;
  title: string;
  description: string;
  claimedAt?: string; // ISO datetime, 미청구 시 undefined
}

/** 전자책 카테고리 - 육아/여행 관련 콘텐츠를 묶는 단위 */
export interface EbookCategory {
  id: string;
  name: string;
  description: string;
}

/** 전자책 한 챕터 - 여러 문단은 "\n\n"으로 구분해 body에 담음 */
export interface EbookChapter {
  title: string;
  body: string;
}

/** 전자책 한 권 - 카테고리에 속하며 주차 단위(예: "2026-W34")로 발행 */
export interface Ebook {
  id: string;
  categoryId: string;
  title: string;
  author: string;
  summary: string;
  /** 발행 주차, ISO 주차 표기 (예: "2026-W34") */
  week: string;
  coverEmoji: string;
  chapters: EbookChapter[];
}

/** 강수 형태 (기상청 PTY 코드 매핑) */
export type PrecipitationType = "none" | "rain" | "rain-snow" | "snow" | "shower";

/** 특정 위치의 현재 날씨 요약 (기상청 초단기실황 기준) */
export interface WeatherSummary {
  /** 관측 기준 시각 (ISO datetime) */
  observedAt: string;
  temperatureCelsius: number;
  humidityPercent: number;
  precipitationType: PrecipitationType;
  /** 1시간 강수량 (mm), 강수 없으면 0 */
  precipitationMm: number;
}
