import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Auth.js v5 reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from env.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, profile }) {
      // Google's stable user id ("sub") becomes our userId.
      if (profile?.sub) token.sub = profile.sub;
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
