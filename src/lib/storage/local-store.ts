/**
 * 로컬 브라우저 저장(localStorage) 기반의 아주 단순한 리스트 저장소.
 *
 * 아직 백엔드 DB가 없어서, 여행 계획/스탬프/리워드는 우선 브라우저에만
 * 저장됩니다. 기기를 바꾸거나 캐시를 지우면 사라지는 게 당연한 한계이고,
 * 실제 서비스 단계에서는 서버 저장소로 옮겨야 해요.
 */

export function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeList<T>(key: string, list: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

export function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
