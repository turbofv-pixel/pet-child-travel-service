import type { Spot } from "@/types";

/**
 * 오픈API 연동 전까지 추천 엔진을 테스트하기 위한 샘플 데이터입니다.
 * 좌표는 대략적인 실제 위치를 참고했지만 정확한 값은 아니며,
 * 실제 서비스에서는 TourAPI / 공공데이터포털 응답으로 대체됩니다.
 */
export const sampleSpots: Spot[] = [
  {
    id: "pet-seoul-forest",
    name: "서울숲",
    companionType: "pet",
    sourceId: "sample-pet-001",
    address: "서울특별시 성동구 뚝섬로 273",
    location: { lat: 37.5443, lng: 127.0374 },
    hasAudioGuide: false,
  },
  {
    id: "pet-siheung-getgol",
    name: "시흥 갯골생태공원",
    companionType: "pet",
    sourceId: "sample-pet-002",
    address: "경기도 시흥시 동서로 287",
    location: { lat: 37.3809, lng: 126.7398 },
    hasAudioGuide: false,
  },
  {
    id: "pet-ansan-hwarang",
    name: "안산 화랑유원지",
    companionType: "pet",
    sourceId: "sample-pet-003",
    address: "경기도 안산시 상록구 화랑로 387",
    location: { lat: 37.3164, lng: 126.8378 },
    hasAudioGuide: false,
  },
  {
    id: "pet-jeju-saryeoni",
    name: "제주 사려니숲길",
    companionType: "pet",
    sourceId: "sample-pet-004",
    address: "제주특별자치도 제주시 명림로 96",
    location: { lat: 33.462, lng: 126.6764 },
    hasAudioGuide: true,
  },
  {
    id: "child-siheung-breathing-playground",
    name: "시흥국민체육센터 숨쉬는놀이터",
    companionType: "child",
    sourceId: "sample-child-001",
    address: "경기도 시흥시 마유로 26",
    location: { lat: 37.38, lng: 126.8027 },
    hasAudioGuide: false,
  },
  {
    id: "child-ansan-industrial-history",
    name: "안산산업역사박물관",
    companionType: "child",
    sourceId: "sample-child-002",
    address: "경기도 안산시 단원구 화랑로 387",
    location: { lat: 37.3219, lng: 126.8309 },
    hasAudioGuide: true,
  },
  {
    id: "child-yongin-suji-eco-park",
    name: "용인 수지생태공원 비지터센터",
    companionType: "child",
    sourceId: "sample-child-003",
    address: "경기도 용인시 수지구 수지로 342",
    location: { lat: 37.3222, lng: 127.098 },
    hasAudioGuide: false,
  },
  {
    id: "child-jeju-aerospace-museum",
    name: "제주 항공우주박물관",
    companionType: "child",
    sourceId: "sample-child-004",
    address: "제주특별자치도 서귀포시 안덕면 녹차분재로 218",
    location: { lat: 33.2997, lng: 126.2925 },
    hasAudioGuide: true,
  },
];
