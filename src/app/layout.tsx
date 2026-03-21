import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth";
import "./globals.css";

const customFont = localFont({
  src: [
    { path: "./fonts/에이투지체-1Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/에이투지체-2ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/에이투지체-3Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/에이투지체-4Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/에이투지체-5Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/에이투지체-6SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/에이투지체-7Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/에이투지체-8ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/에이투지체-9Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "모두의 헌법 - 퀴즈로 즐기는 헌법 상식",
  description: "퀴즈를 풀면서 대한민국 헌법을 쉽고 재미있게 배워보세요.",
  keywords: ["헌법", "퀴즈", "교육", "대한민국", "법률"],
  openGraph: {
    title: "모두의 헌법",
    description: "퀴즈로 즐기는 재미있는 헌법 상식",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${customFont.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
