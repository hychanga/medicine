"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthButton from "./AuthButton";
import LoginScreen from "./LoginScreen";

// Routes that manage their own auth flow and must render even with no session:
// the Workspace SSO handoff (/sso) and the single-logout hop (/sso-logout).
const BYPASS = new Set(["/sso", "/sso-logout"]);

// Gates the whole app: until the user is signed in, only the login screen shows
// (no nav, no protected content). The backend already rejects unauthenticated
// /api calls — this keeps the UI consistent with that.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname && BYPASS.has(pathname)) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#2B2620] text-[#F5EFE3]">
        <span className="animate-pulse text-sm opacity-70">載入中…</span>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen />;
  }

  return (
    <>
      <nav className="flex items-center gap-1 border-b border-black/10 bg-[#2B2620] px-4 py-2 text-sm text-[#F5EFE3]">
        <span className="mr-3 font-semibold tracking-wide">中醫小幫手</span>
        <Link href="/" className="rounded px-3 py-1 transition hover:bg-white/10">
          穴道圖典
        </Link>
        <Link
          href="/inventory"
          className="rounded px-3 py-1 transition hover:bg-white/10"
        >
          藥品庫存
        </Link>
        <AuthButton />
      </nav>
      {children}
    </>
  );
}
