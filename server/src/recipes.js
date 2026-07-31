import { callOpenRouterChat, extractJson } from "./openrouterClient.js";

const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

const SYSTEM_PROMPT =
  "너는 냉장고 속 재료를 활용한 요리 레시피를 추천하는 어시스턴트다. " +
  "사용자가 보유한 재료 목록을 최대한 활용하는 레시피를 정확히 3개 추천하라. " +
  "각 레시피는 제목, 난이도(하/중/상), 예상 조리 시간(분), 인분, 사용된 보유 재료 목록, " +
  "추가로 필요한(부족한) 재료 목록, 단계별 조리 순서를 포함해야 한다. " +
  "레시피의 재료명과 조리 순서에는 사용자가 알려준 실제 재료 이름을 그대로 사용해야 한다. " +
  "'재료A', '재료B', 'Ingredient1' 같은 임의의 placeholder 이름을 절대 사용하지 마라. " +
  "다른 설명, 코드블록, 마크다운 없이 순수 JSON 객체만 다음 스키마로 출력하라.\n" +
  '{"recipes":[{"title":"string","difficulty":"하|중|상","cookTimeMinutes":number,"servings":number,"usedIngredients":["string"],"missingIngredients":["string"],"steps":["string"]}]}';

const HANGUL_RE = /[가-힣]/;
const WORD_RE = /[A-Za-z]{3,}/; // 2글자 이하 라틴 문자(ml, kg 등 단위)는 실제 단어로 보지 않음

// 모델이 가끔 재료명을 "재료A"처럼 placeholder로 치환하거나 통째로 누락시키는 문제가 있어,
// 한글/영단어가 전혀 없는(숫자·괄호·특수문자뿐인) 항목은 의미 없는 값으로 간주하고 걸러냈다.
function isMeaningfulText(str) {
  return typeof str === "string" && (HANGUL_RE.test(str) || WORD_RE.test(str));
}

function sanitizeRecipe(r) {
  return {
    ...r,
    usedIngredients: r.usedIngredients.filter(isMeaningfulText),
    missingIngredients: r.missingIngredients.filter(isMeaningfulText),
    steps: r.steps.filter((s) => isMeaningfulText(s) && s.trim().length >= 4),
  };
}

// 모델이 입력 재료와 무관한 레시피(예: 요청하지 않은 "두부" 요리)를 지어내는 경우가 있어,
// 실제 입력 재료명이 레시피 본문에 최소 개수 이상 등장하는지로 "grounding"을 검증한다.
function countMatchedIngredients(r, ingredientNames) {
  const haystack = [r.title, ...r.usedIngredients, ...r.steps].join(" ");
  return ingredientNames.filter((name) => name && haystack.includes(name)).length;
}

function isRecipeValid(r, ingredientNames) {
  if (!isMeaningfulText(r.title) || r.usedIngredients.length === 0 || r.steps.length < 2) {
    return false;
  }
  const required = Math.min(2, ingredientNames.length);
  return countMatchedIngredients(r, ingredientNames) >= required;
}

function buildUserPrompt({ ingredients, preferences, excludeTitles }) {
  const lines = [];
  const ingredientText = ingredients
    .map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
    .join(", ");
  lines.push(`보유 재료: ${ingredientText}`);

  if (preferences?.servings) lines.push(`인원 수: ${preferences.servings}인분`);
  if (preferences?.difficulty) lines.push(`선호 난이도: ${preferences.difficulty}`);
  if (preferences?.cuisine) lines.push(`선호 요리 종류: ${preferences.cuisine}`);
  if (preferences?.excludeIngredients?.length) {
    lines.push(`제외할 재료(알레르기 등): ${preferences.excludeIngredients.join(", ")}`);
  }
  if (excludeTitles?.length) {
    lines.push(`다음 레시피는 이미 추천했으니 제외하고 새로운 레시피로 추천: ${excludeTitles.join(", ")}`);
  }
  lines.push("위 조건을 반영해 레시피 3개를 JSON으로만 응답해줘.");
  return lines.join("\n");
}

export async function generateRecipes({ ingredients, preferences, excludeTitles }) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    const err = new Error("재료 목록이 비어 있습니다.");
    err.status = 400;
    throw err;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt({ ingredients, preferences, excludeTitles }) },
  ];
  const ingredientNames = ingredients.map((i) => i.name).filter(Boolean);

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const content = await callOpenRouterChat(MODEL, messages, {
        temperature: excludeTitles?.length ? 0.9 : 0.4,
      });
      const parsed = extractJson(content);
      if (parsed && Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
        const recipes = parsed.recipes
          .map((r) => ({
            title: String(r.title ?? "").trim(),
            difficulty: String(r.difficulty ?? "").trim(),
            cookTimeMinutes: Number(r.cookTimeMinutes) || null,
            servings: Number(r.servings) || null,
            usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients.map(String) : [],
            missingIngredients: Array.isArray(r.missingIngredients)
              ? r.missingIngredients.map(String)
              : [],
            steps: Array.isArray(r.steps) ? r.steps.map(String) : [],
          }))
          .map(sanitizeRecipe)
          .filter((r) => isRecipeValid(r, ingredientNames));

        if (recipes.length > 0) return recipes;
        lastError = new Error("모델이 재료명이 누락되거나 손상된 레시피를 반환했습니다.");
        continue;
      }
      lastError = new Error("모델 응답을 JSON으로 해석하지 못했습니다.");
    } catch (err) {
      lastError = err;
      if (err.status === 429) break;
    }
  }

  lastError.status = lastError.status ?? 502;
  throw lastError;
}
