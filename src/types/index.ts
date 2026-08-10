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
