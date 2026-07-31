import "./env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import { recognizeIngredients } from "./ingredients.js";
import { generateRecipes } from "./recipes.js";
import { supabase } from "./supabase.js";
import { optionalAuth } from "./auth.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import savedRecipesRoutes from "./savedRecipesRoutes.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/saved-recipes", savedRecipesRoutes);

app.post("/api/recognize-ingredients", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "이미지 파일이 필요합니다." });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
    return res.status(400).json({ error: "JPEG, PNG, WebP 형식만 지원합니다." });
  }

  try {
    const ingredients = await recognizeIngredients(req.file.buffer, req.file.mimetype);
    res.json({ ingredients });
  } catch (err) {
    console.error("[recognize-ingredients]", err);
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message ?? "재료 인식 중 오류가 발생했습니다." });
  }
});

app.post("/api/generate-recipes", optionalAuth, async (req, res) => {
  const { ingredients, preferences, excludeTitles } = req.body ?? {};

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "재료 목록이 비어 있습니다." });
  }

  const mergedPreferences = { ...preferences };

  if (req.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("allergies, preferred_cuisines, preferred_difficulty")
      .eq("id", req.user.id)
      .single();

    if (profile) {
      mergedPreferences.excludeIngredients = [
        ...new Set([...(preferences?.excludeIngredients ?? []), ...(profile.allergies ?? [])]),
      ];
      if (!mergedPreferences.cuisine && profile.preferred_cuisines?.[0]) {
        mergedPreferences.cuisine = profile.preferred_cuisines[0];
      }
      if (!mergedPreferences.difficulty && profile.preferred_difficulty) {
        mergedPreferences.difficulty = profile.preferred_difficulty;
      }
    }
  }

  try {
    const recipes = await generateRecipes({ ingredients, preferences: mergedPreferences, excludeTitles });
    res.json({ recipes });
  } catch (err) {
    console.error("[generate-recipes]", err);
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message ?? "레시피 생성 중 오류가 발생했습니다." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
