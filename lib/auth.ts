import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { createServerClient } from '@supabase/ssr';
import { hash, compare } from "bcryptjs";

// Helper function to sync user to Supabase
async function syncUserToSupabase(email: string, name: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Supabase not configured, skipping sync");
      return;
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!existingProfile) {
      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          email: email,
          full_name: name,
          role: 'user',
          plan: 'free',
          credits: 10,
          status: 'active',
          last_active_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating Supabase profile:", error);
      } else {
        console.log("✅ User synced to Supabase:", email);
        
        // Log signup activity
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
          
        if (profile) {
          await supabase
            .from('activity_logs')
            .insert({
              user_id: profile.id,
              action: 'user.signup',
              details: { email, name },
            });
        }
      }
    } else {
      // Update last active
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('email', email);
        
      // Log login activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: existingProfile.id,
          action: 'user.login',
          details: { email },
        });
    }
  } catch (error) {
    console.error("Supabase sync error:", error);
    // Don't throw - allow auth to continue even if Supabase sync fails
  }
}

const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter is only used for OAuth providers
  // Credentials provider doesn't use the adapter
  providers: [
    // Credentials provider (email/password) - works without external setup
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
            select: { id: true, email: true, name: true, password: true },
          });

          if (isSignUp) {
            // Sign-up: do not create if email already exists
            if (user) {
              throw new Error("This email is already registered. Please sign in instead.");
            }
            try {
              const hashedPassword = await hash(credentials.password, 10);
              user = await prisma.user.create({
                data: {
                  email,
                  name: userName,
                  emailVerified: null,
                  password: hashedPassword,
                },
                select: { id: true, email: true, name: true, password: true },
              });
              console.log("User created successfully:", user.id);
              await syncUserToSupabase(credentials.email, userName);
            } catch (createError: any) {
              const code = createError?.code;
              if (code === "P2002") {
                throw new Error("This email is already registered. Please sign in instead.");
              }
              if (code === "P1001" || code === "P1002" || code === "P1017") {
                throw new Error("Database connection failed. Please try again later.");
              }
              throw new Error(createError?.message || "Failed to create account. Please try again.");
            }
          } else {
            // Sign-in: user must exist, then verify password
            if (!user) {
              throw new Error("No account found. Please sign up first.");
            }
            if (user.password) {
              const valid = await compare(credentials.password, user.password);
              if (!valid) {
                throw new Error("Incorrect password. Please try again.");
              }
            }
            // Legacy users without stored password: accept any password
            await syncUserToSupabase(credentials.email, user.name || userName);
          }

          return {
            id: user!.id,
            email: user!.email,
            name: user!.name,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error?.message || "Authentication failed. Please check your database connection.");
        }
      },
    }),
    // Google OAuth (optional - only works if credentials are set)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Email provider (optional - only works if SMTP is configured)
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
    async redirect({ url, baseUrl }) {
      // After sign in, send users to dashboard unless they came from a specific URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // For credentials provider (JWT), user is only set at sign-in; use token for ongoing requests
        session.user.id = (user?.id || token?.sub) as string;
        if (token?.email) session.user.email = token.email as string;
        if (token?.name !== undefined) session.user.name = token.name as string | null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id; // Required so session.user.id is set for credentials provider
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt", // Changed to JWT for credentials provider compatibility
  },
};

export { authOptions };

/**
 * Get session from the request's cookies by decoding the NextAuth JWT directly.
 * Uses same cookie parsing as NextAuth. Does not call getServerSession.
 */
export async function getSessionFromRequestCookies(request: Request): Promise<{ user: { id: string; email: string | null; name: string | null } } | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return null;
  const cookieHeader = request.headers.get("cookie") ?? "";
  let cookies: Record<string, string>;
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
 * Get session from next/headers cookies() and decode JWT. Use as fallback in Route Handlers
 * when getServerSession and getSessionFromRequestCookies both fail.
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
 * Resolve session in Route Handlers (same order as videos/generate): request cookies → next/headers → getServerSession.
 * Use in any API route that needs the current user so page-load 401s are fixed.
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
 * Get current user email for API routes. Tries session then dev X-Dev-Email header.
 * Returns null if not authenticated. Use in GET /api/scripts, GET /api/avatar to fix page-load 401.
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
