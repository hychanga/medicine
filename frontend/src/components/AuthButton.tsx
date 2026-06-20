"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs opacity-70">…</span>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        )}
        <span className="hidden text-xs sm:inline">
          {session.user.name ?? session.user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
    >
      以 Google 登入
    </button>
  );
}
