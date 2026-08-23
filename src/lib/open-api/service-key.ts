/**
 * data.go.kr은 서비스키를 "Encoding"(이미 %인코딩됨)과 "Decoding"(원본) 두
 * 형태로 같이 보여주는데, 어느 쪽을 복사해 넣었는지에 따라 URL에 그대로
 * 이어붙이면 요청이 깨집니다 - raw `+`/`=`가 쿼리스트링에서 다른 의미로
 * 해석되거나, 이미 인코딩된 값을 또 인코딩해서 `%25XX`처럼 이중 인코딩되는
 * 등 둘 다 API가 HTTP 400으로 거부하는 원인이 됩니다.
 *
 * 그래서 일단 디코딩을 시도해서 원본으로 정규화한 뒤 한 번만 인코딩합니다 -
 * 어느 쪽 키를 넣어도 결과가 같아집니다. (data.go.kr 자체도 "Decoding" 값을
 * 쓰라고 권장해요.)
 */
export function normalizeServiceKey(rawKey: string): string {
  let decoded = rawKey;
  try {
    decoded = decodeURIComponent(rawKey);
  } catch {
    // 이미 원본(디코딩) 형태라 %XX 패턴이 없거나 잘못된 경우 - 그대로 사용
  }
  return encodeURIComponent(decoded);
}
