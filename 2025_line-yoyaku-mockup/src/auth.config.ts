import type { NextAuthConfig } from "next-auth"

// Notice this is only an object, not a full Auth.js instance
export const authConfig = {
    providers: [],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token?.sub) {
                session.user.id = token.sub
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
            }
            return token
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
} satisfies NextAuthConfig
