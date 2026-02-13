import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { hash, compare } from "bcryptjs";
import { trackUserActivity } from "@/lib/tracking";
import { syncUserToSupabase } from "@/lib/supabase-sync";

const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider (email/password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.trim().toLowerCase();
        const isSignUp = Boolean(credentials.name?.trim());
        const userName = credentials.name?.trim() || credentials.email.split("@")[0];

        try {
          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (isSignUp) {
            if (user) {
              throw new Error("This email is already registered. Please sign in instead.");
            }
            try {
              const hashedPassword = await hash(credentials.password, 10);
              user = await prisma.user.create({
                data: {
                  email,
                  name: userName,
                  image: null,
                  emailVerified: null,
                  password: hashedPassword,
                  niche: null,
                  platforms: null,
                  credits: 10,
                  plan: 'free',
                  payment_status: "pending",
                  stripe_customer_id: null,
                  stripe_subscription_id: null,
                  subscription_status: null,
                },
              });
              console.log("User created successfully:", user.id);
              await syncUserToSupabase({ id: user.id, email: user.email, name: user.name ?? undefined, avatar_url: null });
              trackUserActivity(user.id, "signup").catch(() => {});
            } catch (createError: unknown) {
              const err = createError as { code?: string; message?: string };
              const code = err?.code;
              if (code === "P2002") {
                throw new Error("This email is already registered. Please sign in instead.");
              }
              if (code === "P1001" || code === "P1002" || code === "P1017") {
                throw new Error("Database connection failed. Please try again later.");
              }
              throw new Error(err?.message || "Failed to create account. Please try again.");
            }
          } else {
            if (!user) {
              throw new Error("No account found. Please sign up first.");
            }
            if (user.password) {
              const valid = await compare(credentials.password, user.password);
              if (!valid) {
                throw new Error("Incorrect password. Please try again.");
              }
            }
            await syncUserToSupabase({ id: user.id, email: user.email, name: user.name ?? undefined, avatar_url: null });
            trackUserActivity(user.id, "login").catch(() => {});
          }

          return {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            image: user!.image,
          };
        } catch (error: unknown) {
          console.error("Auth error:", error);
          const message = error instanceof Error ? error.message : "Authentication failed. Please try again.";
          throw new Error(message);
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.EMAIL_SERVER_HOST
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST,
              port: process.env.EMAIL_SERVER_PORT,
              auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
              },
            },
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Sync Google OAuth users to Prisma + Supabase
      if (account?.provider === "google" && user?.email) {
        try {
          const email = user.email.trim().toLowerCase();
          let prismaUser = await prisma.user.findUnique({ where: { email } });
          if (!prismaUser) {
            prismaUser = await prisma.user.create({
              data: {
                email,
                name: user.name ?? email.split("@")[0],
                image: user.image,
                password: null,
                emailVerified: new Date(),
                niche: null,
                platforms: null,
                credits: 10,
                plan: 'free',
                payment_status: 'pending',
                stripe_customer_id: null,
                stripe_subscription_id: null,
                subscription_status: null,
              },
            });
            console.log("Google user created in Prisma:", prismaUser.id);
          } else {
            await prisma.user.update({
              where: { id: prismaUser.id },
              data: { name: user.name ?? prismaUser.name, image: user.image ?? prismaUser.image },
            });
          }
          await syncUserToSupabase({
            id: prismaUser.id,
            email: prismaUser.email,
            name: prismaUser.name ?? undefined,
            avatar_url: user.image ?? prismaUser.image ?? undefined,
          });
          trackUserActivity(prismaUser.id, "login").catch(() => {});
        } catch (err) {
          console.error("Google sign-in sync error:", err);
          // Don't break login - allow auth to continue
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = (user?.id || token?.sub) as string;
        if (token?.email) session.user.email = token.email as string;
        if (token?.name !== undefined) session.user.name = token.name as string | null;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For Google OAuth, use our Prisma user id (look up by email)
        if (account?.provider === "google" && user.email) {
          try {
            const prismaUser = await prisma.user.findUnique({
              where: { email: user.email.trim().toLowerCase() },
              select: { id: true },
            });
            if (prismaUser) {
              token.sub = prismaUser.id;
              token.id = prismaUser.id;
            } else {
              token.sub = user.id;
              token.id = user.id;
            }
          } catch {
            token.sub = user.id;
            token.id = user.id;
          }
        } else {
          token.sub = user.id;
          token.id = user.id;
        }
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn() {
      // Backup: ensure we don't miss any sync
    },
  },
};

export { authOptions };

/**
 * Get session from the request's cookies by decoding the NextAuth JWT directly.
 */
export async function getSessionFromRequestCookies(request: Request): Promise<{ user: { id: string; email: string | null; name: string | null } } | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return null;
  const cookieHeader = request.headers.get("cookie") ?? "";
  let cookies: Record<string, string | undefined>;
  try {
    const { parse } = await import("cookie");
    cookies = parse(cookieHeader);
  } catch {
    cookies = {};
  }
  const sessionCookieName = "next-auth.session-token";
  const secureName = "__Secure-next-auth.session-token";
  let tokenValue = cookies[sessionCookieName] ?? cookies[secureName];
  if (!tokenValue) {
    const chunkKeys = Object.keys(cookies)
      .filter((k) => k.startsWith(sessionCookieName + ".") || k.startsWith(secureName + "."))
      .sort((a, b) => {
        const aNum = parseInt(a.split(".").pop() ?? "0", 10) || 0;
        const bNum = parseInt(b.split(".").pop() ?? "0", 10) || 0;
        return aNum - bNum;
      });
    tokenValue = chunkKeys.map((k) => cookies[k]).join("");
  }
  if (!tokenValue) return null;
  try {
    const { decode } = await import("next-auth/jwt");
    const token = await decode({ token: tokenValue, secret });
    if (!token?.sub) return null;
    return {
      user: {
        id: token.sub,
        email: (token.email as string) ?? null,
        name: (token.name as string) ?? null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Get session from next/headers cookies() and decode JWT.
 */
export async function getSessionFromNextHeadersCookies(): Promise<{ user: { id: string; email: string | null; name: string | null } } | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const tokenValue =
      cookieStore.get("next-auth.session-token")?.value ??
      cookieStore.get("__Secure-next-auth.session-token")?.value;
    if (!tokenValue) return null;
    const { decode } = await import("next-auth/jwt");
    const token = await decode({ token: tokenValue, secret });
    if (!token?.sub) return null;
    return {
      user: {
        id: token.sub,
        email: (token.email as string) ?? null,
        name: (token.name as string) ?? null,
      },
    };
  } catch {
    return null;
  }
}

export type SessionLike = { user: { id: string; email: string | null; name: string | null } };

/**
 * Resolve session in Route Handlers.
 */
export async function getSessionForRequest(request: Request): Promise<SessionLike | null> {
  try {
    const fromRequest = await getSessionFromRequestCookies(request);
    if (fromRequest?.user) return fromRequest;
  } catch {
    // ignore
  }
  try {
    const fromHeaders = await getSessionFromNextHeadersCookies();
    if (fromHeaders?.user) return fromHeaders;
  } catch {
    // ignore
  }
  try {
    const { getServerSession } = await import("next-auth");
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        user: {
          id: (session.user as { id?: string }).id ?? (session.user as { sub?: string }).sub ?? "",
          email: session.user.email ?? null,
          name: session.user.name ?? null,
        },
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get current user email for API routes.
 */
export async function getAuthUserEmail(request: Request): Promise<string | null> {
  const session = await getSessionForRequest(request);
  let email = session?.user?.email ?? null;
  if (session?.user?.id && !email) {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
    email = u?.email ?? null;
  }
  if (email) return email;
  if (process.env.NODE_ENV === "development") {
    const devEmail = request.headers.get("x-dev-email")?.trim();
    if (devEmail) {
      const u = await prisma.user.findUnique({ where: { email: devEmail }, select: { email: true } });
      if (u) return u.email;
    }
  }
  return null;
}