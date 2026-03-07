import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { THEME_COOKIE_NAME } from "@/lib/theme";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gym Journal",
  description: "Personal health and fitness tracking application",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

// inline script runs before paint to avoid theme flash
const themeScript = `
(function(){
  var c=document.cookie.match(/\\b${THEME_COOKIE_NAME}=(light|dark)\\b/);
  var theme=c ? c[1] : (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme==='dark');
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

