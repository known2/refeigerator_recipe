import { callOpenRouterChat, extractJson } from "./openrouterClient.js";

const MODEL = "google/gemma-4-26b-a4b-it:free";

const SYSTEM_PROMPT =
  "너는 이미지 속 냉장고/식재료 사진을 분석하는 어시스턴트다. " +
  "이미지에서 보이는 식재료를 모두 찾아 이름, 대략적인 수량(모르면 빈 문자열), 상태 메모(예: 신선함, 반 정도 남음, 없으면 빈 문자열)를 " +
  "다음 JSON 스키마로만 응답하라. 다른 설명, 코드블록, 마크다운 없이 순수 JSON 객체만 출력하라.\n" +
  '{"ingredients":[{"name":"string","quantity":"string","note":"string"}]}';

export async function recognizeIngredients(buffer, mimetype) {
  const imageDataUrl = `data:${mimetype};base64,${buffer.toString("base64")}`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "이 사진 속 식재료를 인식해서 JSON으로만 응답해줘." },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callOpenRouterChat(MODEL, messages, { temperature: 0.2 });
      const parsed = extractJson(content);
      if (parsed && Array.isArray(parsed.ingredients)) {
        return parsed.ingredients
          .map((i) => ({
            name: String(i.name ?? "").trim(),
            quantity: String(i.quantity ?? "").trim(),
            note: String(i.note ?? "").trim(),
          }))
          .filter((i) => i.name.length > 0);
      }
      lastError = new Error("모델 응답을 JSON으로 해석하지 못했습니다.");
    } catch (err) {
      lastError = err;
      if (err.status === 429) break; // 레이트리밋은 재시도하지 않음
    }
  }

  lastError.status = lastError.status ?? 502;
  throw lastError;
}
