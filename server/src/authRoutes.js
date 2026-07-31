import { Router } from "express";
import { supabase } from "./supabase.js";
import { setSessionCookies, clearSessionCookies, requireAuth } from "./auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, nickname } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다." });
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const isDuplicate = createError.status === 422 || /already|exists/i.test(createError.message ?? "");
    return res
      .status(isDuplicate ? 409 : 400)
      .json({ error: isDuplicate ? "이미 가입된 이메일입니다." : createError.message });
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    nickname: nickname?.trim() || email.split("@")[0],
  });

  if (profileError) {
    console.error("[signup] profile insert failed", profileError);
    return res.status(500).json({ error: "프로필 생성에 실패했습니다." });
  }

  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signedIn.session) {
    return res.status(201).json({ user: null, message: "가입되었습니다. 로그인해주세요." });
  }

  setSessionCookies(res, signedIn.session);
  res.status(201).json({ user: { id: signedIn.user.id, email: signedIn.user.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  setSessionCookies(res, data.session);
  res.json({ user: { id: data.user.id, email: data.user.email } });
});

router.post("/logout", async (_req, res) => {
  clearSessionCookies(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

export default router;
