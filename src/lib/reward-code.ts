/**
 * 리워드 교환 코드 생성.
 *
 * 아직 실제 매장/제휴처에서 쓸 수 있는 코드는 아니에요 (NH 계열사 연계
 * 전까지는 "완주 증표" 성격) - 나중에 실제 제휴 리워드로 바뀌면 이 형식을
 * 그대로 쓰거나 발급처에서 받은 코드로 교체하면 됩니다.
 *
 * 헷갈리는 글자(0/O, 1/I)는 빼서 사람이 직접 옮겨 적어도 실수가 적게
 * 만들었습니다.
 */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRewardCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `PETRIP-${code}`;
}
