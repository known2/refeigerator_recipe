import { useState } from "react";

export default function RecipeDetail({ recipe, onBack, isLoggedIn, onSave, onRequireLogin }) {
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");

  async function handleSaveClick() {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      await onSave(recipe);
      setSaveState("saved");
    } catch (err) {
      setSaveError(err.message);
      setSaveState("error");
    }
  }

  return (
    <div className="recipe-detail">
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        ← 목록으로
      </button>

      <h2>{recipe.title}</h2>
      <div className="recipe-card-meta">
        {recipe.difficulty && <span className="tag">난이도 {recipe.difficulty}</span>}
        {recipe.cookTimeMinutes && <span className="tag tag--mint">⏱ {recipe.cookTimeMinutes}분</span>}
        {recipe.servings && <span className="tag tag--mint">👥 {recipe.servings}인분</span>}
      </div>

      <div className="recipe-detail-ingredients">
        <div>
          <h3>🧺 보유 재료</h3>
          {recipe.usedIngredients.length > 0 ? (
            <ul>
              {recipe.usedIngredients.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-hint">없음</p>
          )}
        </div>
        <div>
          <h3>🛒 추가로 필요한 재료</h3>
          {recipe.missingIngredients.length > 0 ? (
            <ul>
              {recipe.missingIngredients.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-hint">없음</p>
          )}
        </div>
      </div>

      <div className="recipe-detail-steps">
        <h3>👩‍🍳 조리 순서</h3>
        <ol>
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {saveError && <p className="error-text">{saveError}</p>}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSaveClick}
        disabled={saveState === "saving" || saveState === "saved"}
      >
        {saveState === "saved" ? (
          "저장됨 ✓"
        ) : saveState === "saving" ? (
          <>
            <span className="spinner" aria-hidden="true" /> 저장 중...
          </>
        ) : (
          "💾 레시피 저장하기"
        )}
      </button>
    </div>
  );
}
