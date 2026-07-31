export default function IngredientList({ ingredients, onChange }) {
  function updateItem(index, field, value) {
    const next = ingredients.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(next);
  }

  function removeItem(index) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...ingredients, { name: "", quantity: "", note: "" }]);
  }

  return (
    <div className="ingredient-list">
      <div className="ingredient-list-header">
        <h2>인식된 재료 🥕</h2>
        <button type="button" className="btn btn-secondary" onClick={addItem}>
          ➕ 재료 추가
        </button>
      </div>

      {ingredients.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            🌿
          </span>
          <p>인식된 재료가 없습니다. 아래 버튼으로 직접 추가해보세요!</p>
        </div>
      )}

      <ul className="ingredient-items">
        {ingredients.map((item, index) => (
          <li key={index} className="ingredient-item">
            <input
              className="ingredient-input ingredient-input--name"
              placeholder="재료명"
              value={item.name}
              onChange={(e) => updateItem(index, "name", e.target.value)}
            />
            <input
              className="ingredient-input ingredient-input--quantity"
              placeholder="수량"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
            />
            <input
              className="ingredient-input ingredient-input--note"
              placeholder="메모 (예: 신선함)"
              value={item.note}
              onChange={(e) => updateItem(index, "note", e.target.value)}
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem(index)}
              aria-label={`${item.name || "재료"} 삭제`}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
