import { getThemeFromCookie, THEME_COOKIE_NAME } from "@/lib/theme";

describe("getThemeFromCookie", () => {
  it("returns null for undefined input", () => {
    expect(getThemeFromCookie(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getThemeFromCookie("")).toBeNull();
  });

  it('returns "dark" when cookie is set to dark', () => {
    expect(getThemeFromCookie(`${THEME_COOKIE_NAME}=dark`)).toBe("dark");
  });

  it('returns "light" when cookie is set to light', () => {
    expect(getThemeFromCookie(`${THEME_COOKIE_NAME}=light`)).toBe("light");
  });

  it("returns null for an unknown theme value", () => {
    expect(getThemeFromCookie(`${THEME_COOKIE_NAME}=purple`)).toBeNull();
  });

  it("extracts the cookie from a multi-cookie string", () => {
    const cookies = `session=abc123; ${THEME_COOKIE_NAME}=dark; other=value`;
    expect(getThemeFromCookie(cookies)).toBe("dark");
  });
});
