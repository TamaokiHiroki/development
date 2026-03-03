import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Line from "next-auth/providers/line"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
        Line({
            clientId: process.env.LINE_CHANNEL_ID,
            clientSecret: process.env.LINE_CHANNEL_SECRET,
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({ where: { email } })
                    if (!user || !user.password) return null

                    // Note: In a real app, use bcrypt.compare
                    // For now, simple comparison or assume bcrypt is used
                    // We need to install bcryptjs and @types/bcryptjs if we want to use it
                    // For this mock, I'll add the comparison logic assuming bcrypt is installed
                    // If not installed, I should install it.
                    // I didn't install bcryptjs yet. I will add it to the install list or mock it.
                    // Let's assume I'll install it.
                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user
                }
                return null
            },
        }),
    ],
})
