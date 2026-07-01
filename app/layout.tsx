import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://my-ai3-psi.vercel.app"),
  title: "윷능력자",
  description: "던지고, 업고, 잡고, 초능력 카드로 판세를 바꾸는 1:1 전략 윷놀이.",
  openGraph: {
    title: "윷능력자",
    description: "전통 윷놀이 x 초능력 배틀",
    url: "https://my-ai3-psi.vercel.app",
    siteName: "윷능력자",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "윷능력자 공유 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "윷능력자",
    description: "전통 윷놀이 x 초능력 배틀",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
