export default function RecipeList({ recipes, onSelect, onRegenerate, regenerating }) {
  return (
    <div className="recipe-list">
      <div className="recipe-list-header">
        <h2>추천 레시피 🍳</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRegenerate}
          disabled={regenerating}
        >
          {regenerating ? (
            <>
              <span className="spinner" aria-hidden="true" /> 다시 추천 중...
            </>
          ) : (
            "🔄 다른 레시피 추천받기"
          )}
        </button>
      </div>

      <div className="recipe-cards">
        {recipes.map((recipe, index) => (
          <button
            type="button"
            key={`${recipe.title}-${index}`}
            className="recipe-card"
            onClick={() => onSelect(index)}
          >
            <span className="recipe-card-thumb" aria-hidden="true">
              🍲
            </span>
            <h3>{recipe.title}</h3>
            <div className="recipe-card-meta">
              {recipe.difficulty && <span className="tag">난이도 {recipe.difficulty}</span>}
              {recipe.cookTimeMinutes && <span className="tag tag--mint">⏱ {recipe.cookTimeMinutes}분</span>}
              {recipe.servings && <span className="tag tag--mint">👥 {recipe.servings}인분</span>}
            </div>
            {recipe.usedIngredients.length > 0 && (
              <p className="recipe-card-ingredients">
                {recipe.usedIngredients.slice(0, 4).join(", ")}
                {recipe.usedIngredients.length > 4 ? " 외" : ""}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
