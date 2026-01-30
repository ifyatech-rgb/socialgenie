import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { createServerClient } from '@supabase/ssr';

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

export const authOptions: NextAuthOptions = {
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

        try {
          // Find or create user by email
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          const userName = credentials.name || credentials.email.split("@")[0];

          if (!user) {
            // Auto-create user for demo purposes
            // In production, you'd want a proper signup flow with password hashing
            try {
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: userName,
                  emailVerified: null,
                },
              });
              console.log("User created successfully:", user.id);
              
              // Sync to Supabase
              await syncUserToSupabase(credentials.email, userName);
            } catch (createError: any) {
              console.error("Error creating user:", createError);
              // If user creation fails, try to find again (race condition / email already exists)
              user = await prisma.user.findUnique({
                where: { email: credentials.email },
              });
              if (user) {
                // Email already registered - treat as login
                await syncUserToSupabase(credentials.email, user.name || userName);
              } else {
                // Real failure: surface a clearer message
                const code = createError?.code;
                if (code === "P2002") {
                  throw new Error("Email already registered. Try logging in.");
                }
                if (code === "P1001" || code === "P1002" || code === "P1017") {
                  throw new Error("Database connection failed. Please try again later.");
                }
                throw new Error(createError?.message || "Failed to create account. Please try again.");
              }
            }
          } else {
            // Existing user - sync to Supabase (update last_active)
            await syncUserToSupabase(credentials.email, user.name || userName);
          }

          // For demo: accept any password (in production, verify password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          // Return a more specific error message
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
    async session({ session, user, token }) {
      if (session.user) {
        // For credentials provider, user might be in token
        session.user.id = (user?.id || token?.sub) as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt", // Changed to JWT for credentials provider compatibility
  },
};
