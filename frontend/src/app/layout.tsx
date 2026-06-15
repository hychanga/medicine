import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "穴道圖典 · 經絡查詢",
  description: "互動經絡圖、全身穴位與症狀方劑對照，以及藥品庫存管理。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&family=Noto+Serif+TC:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <nav className="flex items-center gap-1 border-b border-black/10 bg-[#2B2620] px-4 py-2 text-sm text-[#F5EFE3]">
            <span className="mr-3 font-semibold tracking-wide">中醫小幫手</span>
            <Link
              href="/"
              className="rounded px-3 py-1 hover:bg-white/10 transition"
            >
              穴道圖典
            </Link>
            <Link
              href="/inventory"
              className="rounded px-3 py-1 hover:bg-white/10 transition"
            >
              藥品庫存
            </Link>
            <AuthButton />
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
