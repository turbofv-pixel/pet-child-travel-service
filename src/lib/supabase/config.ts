/**
 * Supabase가 설정돼 있는지 확인합니다. 아직 프로젝트를 안 만들었거나 키를
 * 안 넣은 상태에서도(=로컬 개발 초기 단계) 앱 전체가 죽지 않게, 이 값을 보고
 * 로그인/DB 저장 기능을 조용히 localStorage 폴백으로 돌립니다.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
