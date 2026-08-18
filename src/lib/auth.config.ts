import type { NextAuthConfig } from "next-auth";

/**
 * Config compartida entre el middleware (Edge runtime, sin Prisma/Node APIs)
 * y la config completa en auth.ts (Node runtime, con el provider Credentials).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
