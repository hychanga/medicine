import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// The shared Google OAuth client id of the Workspace Gateway. The Gateway hands
// off the signed-in identity as a Google id_token whose `aud` equals this value;
// we only accept handoff tokens minted for this client. Overridable via env, but
// the default matches the Workspace's shared client so SSO works out of the box.
const SSO_GOOGLE_CLIENT_ID =
  process.env.SSO_GOOGLE_CLIENT_ID ??
  "880984423210-pjrarole80lvni09o251fq07j83is2f6.apps.googleusercontent.com";

/**
 * Verify a Google id_token without pulling in a dependency: Google's tokeninfo
 * endpoint validates the signature and expiry server-side. We additionally check
 * the audience (must be our shared client) and that the email is verified. This
 * is the same dependency-free approach the other Workspace apps use.
 */
async function verifyGoogleIdToken(idToken: string) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const p = (await res.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };
  if (p.aud !== SSO_GOOGLE_CLIENT_ID) return null;
  if (p.email_verified !== true && p.email_verified !== "true") return null;
  if (!p.sub) return null;
  return p;
}

// Auth.js v5 reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from env.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    // Workspace SSO handoff. The Gateway sends the user to /sso#id_token=…; that
    // page exchanges the token here for a normal NextAuth session — identical to
    // the session a standalone Google login produces (same Google `sub` → same
    // userId → same data). The Spring backend is untouched: the BFF keeps signing
    // its HS256 token from whatever session exists.
    Credentials({
      id: "workspace-sso",
      name: "Workspace SSO",
      credentials: { idToken: {} },
      async authorize(creds) {
        const idToken = creds?.idToken;
        if (typeof idToken !== "string" || !idToken) return null;
        const p = await verifyGoogleIdToken(idToken);
        if (!p) return null;
        return {
          id: p.sub!,
          email: p.email ?? null,
          name: p.name ?? null,
          image: p.picture ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, profile, user }) {
      // Google OAuth path exposes the stable id as profile.sub; the credentials
      // (SSO) path exposes it as user.id. Either way it becomes our userId.
      if (profile?.sub) token.sub = profile.sub;
      else if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
