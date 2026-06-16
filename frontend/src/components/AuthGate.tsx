"use client";

import { useSession } from "next-auth/react";
import LoginScreen from "./LoginScreen";

// Gates the whole app: until the user is signed in, only the login screen
// shows (no nav, no protected content). The backend already rejects
// unauthenticated /api calls — this keeps the UI consistent with that.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

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

  return <>{children}</>;
}
