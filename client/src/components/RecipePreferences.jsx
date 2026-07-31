export default function RecipePreferences({ preferences, onChange, disabled }) {
  function update(field, value) {
    onChange({ ...preferences, [field]: value });
  }

  return (
    <div className="preferences">
      <h2>레시피 선호도 (선택) 🍽️</h2>
      <div className="preferences-grid">
        <label className="preferences-field">
          인원 수
          <input
            type="number"
            min="1"
            max="10"
            value={preferences.servings}
            disabled={disabled}
            onChange={(e) => update("servings", e.target.value)}
          />
        </label>

        <label className="preferences-field">
          난이도
          <select
            value={preferences.difficulty}
            disabled={disabled}
            onChange={(e) => update("difficulty", e.target.value)}
          >
            <option value="">상관없음</option>
            <option value="하">하</option>
            <option value="중">중</option>
            <option value="상">상</option>
          </select>
        </label>

        <label className="preferences-field">
          요리 종류
          <select
            value={preferences.cuisine}
            disabled={disabled}
            onChange={(e) => update("cuisine", e.target.value)}
          >
            <option value="">상관없음</option>
            <option value="한식">한식</option>
            <option value="양식">양식</option>
            <option value="중식">중식</option>
            <option value="일식">일식</option>
          </select>
        </label>

        <label className="preferences-field preferences-field--wide">
          제외할 재료 (쉼표로 구분)
          <input
            type="text"
            placeholder="예: 땅콩, 새우"
            value={preferences.excludeIngredients}
            disabled={disabled}
            onChange={(e) => update("excludeIngredients", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
