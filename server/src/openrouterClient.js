export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function callOpenRouterChat(model, messages, { temperature = 0.3 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    const err = new Error("OPENROUTER_API_KEY가 설정되지 않았습니다.");
    err.status = 500;
    throw err;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Fridge Recipe Recognizer",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(
      response.status === 429
        ? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (무료 모델 레이트 리밋)"
        : `OpenRouter API 오류 (${response.status}): ${text.slice(0, 200)}`
    );
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("모델 응답이 비어 있습니다.");
    err.status = 502;
    throw err;
  }
  return content;
}
