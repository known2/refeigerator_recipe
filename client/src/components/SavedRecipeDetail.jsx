import { useState } from "react";

export default function SavedRecipeDetail({ recipe, onBack, onDelete, onSaveMemo }) {
  const [memo, setMemo] = useState(recipe.memo ?? "");
  const [savingMemo, setSavingMemo] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveMemo() {
    setSavingMemo(true);
    try {
      await onSaveMemo(recipe.id, memo);
    } finally {
      setSavingMemo(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(recipe.id);
    } finally {
      setDeleting(false);
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
          <ul>
            {recipe.usedIngredients.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>🛒 추가로 필요한 재료</h3>
          <ul>
            {recipe.missingIngredients.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
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

      <div className="memo-editor">
        <h3>📝 메모</h3>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이 레시피에 대한 메모를 남겨보세요"
        />
        <div className="auth-form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSaveMemo} disabled={savingMemo}>
            {savingMemo ? (
              <>
                <span className="spinner spinner--accent" aria-hidden="true" /> 저장 중...
              </>
            ) : (
              "💾 메모 저장"
            )}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <span className="spinner spinner--danger" aria-hidden="true" /> 삭제 중...
              </>
            ) : (
              "🗑️ 레시피 삭제"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
