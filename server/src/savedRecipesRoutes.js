import { Router } from "express";
import { supabase } from "./supabase.js";
import { requireAuth } from "./auth.js";

const router = Router();

function toRecipeDto(row) {
  return {
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    usedIngredients: row.used_ingredients ?? [],
    missingIngredients: row.missing_ingredients ?? [],
    steps: row.steps ?? [],
    memo: row.memo ?? "",
    savedAt: row.saved_at,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("saved_recipes")
    .select("*")
    .eq("user_id", req.user.id)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("[saved-recipes:list]", error);
    return res.status(500).json({ error: "저장된 레시피를 불러오지 못했습니다." });
  }
  res.json({ recipes: data.map(toRecipeDto) });
});

router.post("/", requireAuth, async (req, res) => {
  const r = req.body ?? {};
  if (!r.title || !Array.isArray(r.steps) || r.steps.length === 0) {
    return res.status(400).json({ error: "저장할 레시피 정보가 올바르지 않습니다." });
  }

  const { data, error } = await supabase
    .from("saved_recipes")
    .insert({
      user_id: req.user.id,
      title: r.title,
      difficulty: r.difficulty || null,
      cook_time_minutes: r.cookTimeMinutes || null,
      servings: r.servings || null,
      used_ingredients: r.usedIngredients ?? [],
      missing_ingredients: r.missingIngredients ?? [],
      steps: r.steps ?? [],
      memo: r.memo ?? "",
    })
    .select()
    .single();

  if (error) {
    console.error("[saved-recipes:create]", error);
    return res.status(500).json({ error: "레시피 저장에 실패했습니다." });
  }
  res.status(201).json({ recipe: toRecipeDto(data) });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { memo } = req.body ?? {};
  const { data, error } = await supabase
    .from("saved_recipes")
    .update({ memo: memo ?? "" })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "레시피를 찾을 수 없습니다." });
  }
  res.json({ recipe: toRecipeDto(data) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { error, count } = await supabase
    .from("saved_recipes")
    .delete({ count: "exact" })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) {
    console.error("[saved-recipes:delete]", error);
    return res.status(500).json({ error: "삭제에 실패했습니다." });
  }
  if (!count) {
    return res.status(404).json({ error: "레시피를 찾을 수 없습니다." });
  }
  res.json({ ok: true });
});

export default router;
