export const THEME_COOKIE_NAME = "gym-theme";
export type Theme = "light" | "dark";

export function getThemeFromCookie(cookieString: string | undefined): Theme | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`${THEME_COOKIE_NAME}=(${["light", "dark"].join("|")})`));
  return match ? (match[1] as Theme) : null;
}

export function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}
