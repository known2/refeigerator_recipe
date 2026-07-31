import { supabase } from "./supabase.js";

const ACCESS_COOKIE = "sb_access_token";
const REFRESH_COOKIE = "sb_refresh_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // 로컬 개발용. 배포 시 HTTPS와 함께 true로 변경 필요
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
};

export function setSessionCookies(res, session) {
  res.cookie(ACCESS_COOKIE, session.access_token, COOKIE_OPTIONS);
  res.cookie(REFRESH_COOKIE, session.refresh_token, COOKIE_OPTIONS);
}

export function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
}

async function resolveUser(req, res) {
  const accessToken = req.cookies?.[ACCESS_COOKIE];
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!accessToken) return null;

  const { data } = await supabase.auth.getUser(accessToken);
  if (data?.user) return data.user;

  if (refreshToken) {
    const { data: refreshed } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (refreshed?.session) {
      setSessionCookies(res, refreshed.session);
      return refreshed.session.user;
    }
  }

  clearSessionCookies(res);
  return null;
}

export async function requireAuth(req, res, next) {
  const user = await resolveUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  req.user = await resolveUser(req, res);
  next();
}
