/**
 * data.go.kr 공통 게이트웨이 오류 형식.
 *
 * 정상 응답이나 TourAPI/기상청 자체 오류는 `{ response: { header: {...} } }`
 * 형태지만, 서비스 등록 문제나 트래픽 초과 같은 "게이트웨이 레벨" 오류는
 * 완전히 다른 `{ OpenAPI_ServiceResponse: { cmmMsgHeader: {...} } }` 형태로
 * 옵니다 (심지어 HTTP 200으로 오기도 함). 이걸 구분 안 하고 `response.header`를
 * 그대로 읽으면 `undefined.header`에서 raw TypeError가 나서, 우리 쪽
 * TourApiError/WeatherApiError로 못 잡고 "알 수 없는 오류"로 뭉개져버립니다.
 */
interface OpenApiGatewayErrorBody {
  OpenAPI_ServiceResponse: {
    cmmMsgHeader: {
      errMsg: string;
      returnAuthMsg: string;
      returnReasonCode: string;
    };
  };
}

function isGatewayErrorBody(body: unknown): body is OpenApiGatewayErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "OpenAPI_ServiceResponse" in body
  );
}

/** 게이트웨이 오류 형식이면 사람이 읽을 수 있는 메시지를, 아니면 null을 반환합니다. */
export function extractGatewayErrorMessage(body: unknown): string | null {
  if (!isGatewayErrorBody(body)) return null;

  const header = body.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (!header) return "data.go.kr 게이트웨이 오류 (형식 불명)";

  return `${header.errMsg} - ${header.returnAuthMsg} (코드 ${header.returnReasonCode})`;
}
