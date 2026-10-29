import type { CSSProperties } from "react";

/** Recharts tooltip styling that follows the light/dark theme tokens. */
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.35)",
};
