import { useEffect, useState } from "react";
import ImageUploader from "./components/ImageUploader.jsx";
import IngredientList from "./components/IngredientList.jsx";
import RecipePreferences from "./components/RecipePreferences.jsx";
import RecipeList from "./components/RecipeList.jsx";
import RecipeDetail from "./components/RecipeDetail.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import MyPage from "./components/MyPage.jsx";
import Modal from "./components/Modal.jsx";
import { api } from "./lib/api.js";
import "./App.css";

const EMPTY_PREFERENCES = { servings: "", difficulty: "", cuisine: "", excludeIngredients: "" };

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMessage, setErrorMessage] = useState("");

  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [recipes, setRecipes] = useState([]);
  const [recipeStatus, setRecipeStatus] = useState("idle"); // idle | loading | done | error
  const [recipeError, setRecipeError] = useState("");
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(null);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("home"); // home | auth | profile | mypage
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileSelect(selected) {
    setFile(selected);
    setIngredients([]);
    setStatus("idle");
    setErrorMessage("");
    resetRecipes();
  }

  function resetRecipes() {
    setRecipes([]);
    setRecipeStatus("idle");
    setRecipeError("");
    setSelectedRecipeIndex(null);
  }

  async function handleRecognize() {
    if (!file) return;
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/recognize-ingredients", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "재료 인식에 실패했습니다.");
      }

      setIngredients(data.ingredients ?? []);
      setStatus("done");
    } catch (err) {
      setErrorMessage(err.message ?? "알 수 없는 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  async function handleGenerateRecipes(regenerate = false) {
    const validIngredients = ingredients
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim(), note: i.note.trim() }))
      .filter((i) => i.name.length > 0);

    if (validIngredients.length === 0) return;

    setRecipeStatus("loading");
    setRecipeError("");
    setSelectedRecipeIndex(null);

    const payload = {
      ingredients: validIngredients,
      preferences: {
        servings: preferences.servings ? Number(preferences.servings) : undefined,
        difficulty: preferences.difficulty || undefined,
        cuisine: preferences.cuisine || undefined,
        excludeIngredients: preferences.excludeIngredients
          ? preferences.excludeIngredients.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      },
      excludeTitles: regenerate ? recipes.map((r) => r.title) : undefined,
    };

    try {
      const res = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "레시피 생성에 실패했습니다.");
      }

      setRecipes(data.recipes ?? []);
      setRecipeStatus("done");
    } catch (err) {
      setRecipeError(err.message ?? "알 수 없는 오류가 발생했습니다.");
      setRecipeStatus("error");
    }
  }

  async function handleSaveRecipe(recipe) {
    await api.post("/api/saved-recipes", recipe);
  }

  async function handleLogout() {
    await api.post("/api/auth/logout", {});
    setUser(null);
    setPage("home");
  }

  const selectedRecipe = selectedRecipeIndex !== null ? recipes[selectedRecipeIndex] : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <div className="logo-row">
            <span className="logo-badge" aria-hidden="true">
              🧑‍🍳
            </span>
            <div>
              <h1>냉장고 재료 인식 &amp; 레시피 추천</h1>
              <p>냉장고 사진 한 장으로 재료를 인식하고, 딱 맞는 레시피를 추천해드려요 🥕</p>
            </div>
          </div>
          <nav className="app-nav">
            {authChecked && user ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setPage("mypage")}>
                  📖 마이페이지
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setPage("profile")}>
                  👤 프로필
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                  🚪 로그아웃
                </button>
              </>
            ) : (
              authChecked && (
                <button type="button" className="btn btn-primary" onClick={() => setPage("auth")}>
                  ✨ 로그인 / 회원가입
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {page === "auth" && (
          <AuthPanel
            onAuthed={(u) => {
              setUser(u);
              setPage("home");
            }}
            onCancel={() => setPage("home")}
          />
        )}

        {page === "profile" && <ProfileForm onBack={() => setPage("home")} />}

        {page === "mypage" && <MyPage onBack={() => setPage("home")} />}

        {page === "home" && (
          <div className="home-flow">
            {!selectedRecipe && (
              <section className="card step-card">
                <span className="step-badge">STEP 1</span>
                <div className="step-card-heading">
                  <h2>냉장고 사진 올리기 📸</h2>
                  <p className="step-card-sub">사진 한 장이면 재료를 자동으로 찾아드려요</p>
                </div>

                <ImageUploader
                  onFileSelect={handleFileSelect}
                  previewUrl={previewUrl}
                  disabled={status === "loading"}
                />

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={!file || status === "loading"}
                  onClick={handleRecognize}
                >
                  {status === "loading" ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> 인식 중...
                    </>
                  ) : (
                    "🔍 재료 인식하기"
                  )}
                </button>

                {status === "error" && <p className="error-text">{errorMessage}</p>}
              </section>
            )}

            {!selectedRecipe && (status === "done" || ingredients.length > 0) && (
              <section className="card step-card">
                <span className="step-badge">STEP 2</span>
                <IngredientList ingredients={ingredients} onChange={setIngredients} />
              </section>
            )}

            {status === "done" && !selectedRecipe && (
              <section className="card step-card">
                <span className="step-badge">STEP 3</span>
                <RecipePreferences
                  preferences={preferences}
                  onChange={setPreferences}
                  disabled={recipeStatus === "loading"}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={ingredients.every((i) => !i.name.trim()) || recipeStatus === "loading"}
                  onClick={() => handleGenerateRecipes(false)}
                >
                  {recipeStatus === "loading" ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> 레시피 생성 중...
                    </>
                  ) : (
                    "🍳 레시피 추천받기 →"
                  )}
                </button>

                {recipeStatus === "error" && <p className="error-text">{recipeError}</p>}
              </section>
            )}

            {recipeStatus === "done" && !selectedRecipe && recipes.length > 0 && (
              <section className="card step-card">
                <span className="step-badge">STEP 4</span>
                <RecipeList
                  recipes={recipes}
                  onSelect={setSelectedRecipeIndex}
                  onRegenerate={() => handleGenerateRecipes(true)}
                  regenerating={recipeStatus === "loading"}
                />
              </section>
            )}

            {selectedRecipe && (
              <RecipeDetail
                recipe={selectedRecipe}
                onBack={() => setSelectedRecipeIndex(null)}
                isLoggedIn={Boolean(user)}
                onSave={handleSaveRecipe}
                onRequireLogin={() => setShowLoginPrompt(true)}
              />
            )}
          </div>
        )}
      </main>

      {showLoginPrompt && (
        <Modal onClose={() => setShowLoginPrompt(false)}>
          <span className="modal-icon" aria-hidden="true">
            🔐
          </span>
          <h3>로그인이 필요합니다</h3>
          <p>레시피를 저장하려면 먼저 로그인해주세요.</p>
          <div className="auth-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowLoginPrompt(false);
                setPage("auth");
              }}
            >
              로그인하기
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowLoginPrompt(false)}>
              닫기
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
