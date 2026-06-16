"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

/**
 * Workspace SSO landing. The Gateway redirects here as
 *   /sso#id_token=<google_id_token>
 * The token rides in the URL *fragment* so it never reaches our server or logs.
 * We read it client-side, exchange it for a NextAuth session, and continue to /.
 */
export default function SsoPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, "");
    const idToken = new URLSearchParams(hash).get("id_token");

    // Drop the token from the address bar / history immediately.
    history.replaceState(null, "", window.location.pathname);

    if (!idToken) {
      setError("缺少登入憑證");
      return;
    }

    signIn("workspace-sso", { idToken, redirect: false })
      .then((res) => {
        if (res?.error) setError("登入失敗，請重試");
        else window.location.replace("/");
      })
      .catch(() => setError("登入失敗，請重試"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#2B2620] text-[#F5EFE3]">
      {error ? (
        <>
          <p className="text-sm opacity-80">{error}</p>
          <a
            href="/"
            className="text-sm underline opacity-70 transition hover:opacity-100"
          >
            前往登入
          </a>
        </>
      ) : (
        <>
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          <p className="text-sm opacity-70">登入中…</p>
        </>
      )}
    </main>
  );
}
