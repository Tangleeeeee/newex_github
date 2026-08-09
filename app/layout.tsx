import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegisterServiceWorker } from "./register-sw";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "newex — 매일 새로운 경험",
  description: "하루에 하나씩, 안 해봤던 새로운 경험을 기록하세요.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "newex",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1f36",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${fraunces.variable} font-sans antialiased bg-offwhite min-h-screen`}>
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
