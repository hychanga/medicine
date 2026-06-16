"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Single-logout hop. The Gateway chains top-level navigations through each app's
 * /sso-logout (a first-party context where it can clear its own session), each
 * hop carrying `next` to the following one. We clear the NextAuth session, then
 * continue the chain.
 */
export default function SsoLogoutPage() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const next = new URLSearchParams(window.location.search).get("next");
    signOut({ redirect: false }).finally(() => {
      window.location.replace(next || "/");
    });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#2B2620] text-[#F5EFE3]">
      <p className="text-sm opacity-70">登出中…</p>
    </main>
  );
}
