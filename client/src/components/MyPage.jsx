import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import SavedRecipeDetail from "./SavedRecipeDetail.jsx";

export default function MyPage({ onBack }) {
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  function load() {
    setStatus("loading");
    api
      .get("/api/saved-recipes")
      .then((data) => {
        setRecipes(data.recipes ?? []);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }

  useEffect(load, []);

  async function handleDelete(id) {
    await api.delete(`/api/saved-recipes/${id}`);
    setSelectedId(null);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSaveMemo(id, memo) {
    const data = await api.patch(`/api/saved-recipes/${id}`, { memo });
    setRecipes((prev) => prev.map((r) => (r.id === id ? data.recipe : r)));
  }

  const selected = recipes.find((r) => r.id === selectedId);
  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  if (selected) {
    return (
      <SavedRecipeDetail
        recipe={selected}
        onBack={() => setSelectedId(null)}
        onDelete={handleDelete}
        onSaveMemo={handleSaveMemo}
      />
    );
  }

  return (
    <div className="mypage">
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        ← 뒤로
      </button>
      <h2>마이페이지 - 저장한 레시피 📖</h2>

      <div className="search-field">
        <input
          type="text"
          placeholder="레시피 제목 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {status === "loading" && (
        <div className="empty-state">
          <span className="spinner spinner--accent" aria-hidden="true" />
          <p>불러오는 중...</p>
        </div>
      )}
      {status === "error" && <p className="error-text">{error}</p>}
      {status === "ready" && filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            📭
          </span>
          <p>아직 저장한 레시피가 없어요. 마음에 드는 레시피를 저장해보세요!</p>
        </div>
      )}

      <div className="recipe-cards">
        {filtered.map((recipe) => (
          <button
            type="button"
            key={recipe.id}
            className="recipe-card"
            onClick={() => setSelectedId(recipe.id)}
          >
            <span className="recipe-card-thumb" aria-hidden="true">
              🍲
            </span>
            <h3>{recipe.title}</h3>
            <div className="recipe-card-meta">
              {recipe.difficulty && <span className="tag">난이도 {recipe.difficulty}</span>}
              {recipe.cookTimeMinutes && <span className="tag tag--mint">⏱ {recipe.cookTimeMinutes}분</span>}
            </div>
            <p className="recipe-card-ingredients">
              🗓 {new Date(recipe.savedAt).toLocaleDateString("ko-KR")} 저장
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
