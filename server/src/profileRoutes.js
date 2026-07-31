import { Router } from "express";
import { supabase } from "./supabase.js";
import { requireAuth } from "./auth.js";

const router = Router();

function toProfileDto(row) {
  return {
    nickname: row.nickname ?? "",
    allergies: row.allergies ?? [],
    preferredCuisines: row.preferred_cuisines ?? [],
    preferredDifficulty: row.preferred_difficulty ?? "",
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) {
    console.error("[profile:get]", error);
    return res.status(500).json({ error: "프로필을 불러오지 못했습니다." });
  }

  // 가입 도중 문제 등으로 프로필 행이 누락된 경우를 대비해 자동으로 기본 프로필을 만들어준다.
  if (!data) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({ id: req.user.id, nickname: req.user.email?.split("@")[0] ?? "" })
      .select()
      .single();

    if (createError) {
      console.error("[profile:autocreate]", createError);
      return res.status(500).json({ error: "프로필을 불러오지 못했습니다." });
    }
    return res.json({ profile: toProfileDto(created) });
  }

  res.json({ profile: toProfileDto(data) });
});

router.put("/", requireAuth, async (req, res) => {
  const { nickname, allergies, preferredCuisines, preferredDifficulty } = req.body ?? {};

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: req.user.id,
      nickname: (nickname ?? "").trim(),
      allergies: Array.isArray(allergies) ? allergies.map(String) : [],
      preferred_cuisines: Array.isArray(preferredCuisines) ? preferredCuisines.map(String) : [],
      preferred_difficulty: preferredDifficulty || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[profile:update]", error);
    return res.status(500).json({ error: "프로필 저장에 실패했습니다." });
  }
  res.json({ profile: toProfileDto(data) });
});

export default router;
