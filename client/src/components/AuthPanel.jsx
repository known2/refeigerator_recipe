import { useState } from "react";
import { api } from "../lib/api.js";

export default function AuthPanel({ onAuthed, onCancel }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.post("/api/auth/login", { email, password })
          : await api.post("/api/auth/signup", { email, password, nickname });

      if (data.user) {
        onAuthed(data.user);
      } else {
        setMode("login");
        setError(data.message ?? "가입되었습니다. 로그인해주세요.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-panel-tabs">
        <button
          type="button"
          className={mode === "login" ? "tab tab--active" : "tab"}
          onClick={() => setMode("login")}
        >
          로그인
        </button>
        <button
          type="button"
          className={mode === "signup" ? "tab tab--active" : "tab"}
          onClick={() => setMode("signup")}
        >
          회원가입
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label className="preferences-field">
            닉네임
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="선택 입력"
            />
          </label>
        )}
        <label className="preferences-field">
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="preferences-field">
          비밀번호
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="auth-form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> 처리 중...
              </>
            ) : mode === "login" ? (
              "🔓 로그인"
            ) : (
              "🎉 회원가입"
            )}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
