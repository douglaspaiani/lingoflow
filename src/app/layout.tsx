import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";
import { TopBar, BottomNav } from "../components/Navigation";
import { LayoutWrapper } from "../components/LayoutWrapper";

export const metadata: Metadata = {
  title: "LingoFlow",
  description: "Aprenda Idiomas com Gamificação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/images/favicon.png" />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
            <TopBar />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
