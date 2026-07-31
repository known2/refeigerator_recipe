import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const CUISINE_OPTIONS = ["한식", "양식", "중식", "일식"];

export default function ProfileForm({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [cuisines, setCuisines] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | saving | error
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/profile")
      .then((data) => {
        setProfile(data.profile);
        setNickname(data.profile.nickname ?? "");
        setAllergiesText((data.profile.allergies ?? []).join(", "));
        setCuisines(data.profile.preferredCuisines ?? []);
        setDifficulty(data.profile.preferredDifficulty ?? "");
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  function toggleCuisine(c) {
    setCuisines((prev) => (prev.includes(c) ? prev.filter((v) => v !== c) : [...prev, c]));
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const data = await api.put("/api/profile", {
        nickname,
        allergies: allergiesText.split(",").map((s) => s.trim()).filter(Boolean),
        preferredCuisines: cuisines,
        preferredDifficulty: difficulty,
      });
      setProfile(data.profile);
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("ready");
    }
  }

  if (status === "loading")
    return (
      <div className="empty-state">
        <span className="spinner spinner--accent" aria-hidden="true" />
        <p>프로필을 불러오는 중...</p>
      </div>
    );

  return (
    <div className="profile-form">
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        ← 뒤로
      </button>
      <h2>내 프로필 👤</h2>

      <form onSubmit={handleSave} className="preferences">
        <div className="preferences-grid">
          <label className="preferences-field">
            닉네임
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </label>

          <label className="preferences-field">
            선호 난이도
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">상관없음</option>
              <option value="하">하</option>
              <option value="중">중</option>
              <option value="상">상</option>
            </select>
          </label>

          <label className="preferences-field preferences-field--wide">
            알레르기 / 제외 재료 (쉼표로 구분)
            <input
              type="text"
              placeholder="예: 땅콩, 새우"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
            />
          </label>

          <div className="preferences-field preferences-field--wide">
            선호 요리 종류 (다중 선택)
            <div className="cuisine-options">
              {CUISINE_OPTIONS.map((c) => (
                <label key={c} className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={cuisines.includes(c)}
                    onChange={() => toggleCuisine(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
          {status === "saving" ? (
            <>
              <span className="spinner" aria-hidden="true" /> 저장 중...
            </>
          ) : (
            "💾 프로필 저장"
          )}
        </button>
      </form>
    </div>
  );
}
