import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "윷능력자",
  description: "초능력 윷놀이 배틀 게임",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
