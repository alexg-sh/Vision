import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials"; // Import CredentialsProvider
import bcrypt from "bcrypt"; // Import bcrypt
import type { RequestInternal } from "next-auth";
import type { User, Account, Profile } from "next-auth";
// Import providers as needed, e.g.:
// import GithubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Add your authentication providers here
    CredentialsProvider({
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          console.error("No user found or user has no password set");
          // Optionally: Handle users who signed up via OAuth differently
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          console.error("Invalid password");
          return null;
        }

        console.log("Credentials valid, returning user:", { id: user.id, name: user.name, email: user.email });
        // Return only essential user info, excluding the password hash
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          // Add any other non-sensitive fields needed for the session/token
        };
      }
    })
    // ... other providers like Google, GitHub etc. can be added here
  ],
  pages: {
    signIn: '/login', // Set the custom login page path
    // ... other custom pages if needed
  },
  session: {
    strategy: "jwt", // Use JWT for session strategy
  },
  callbacks: {
    // Add custom callbacks if needed (e.g., to add user ID to session)
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub ?? ""; // Add user ID from token to session, fallback to an empty string
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist the user ID onto the token right after signin
      if (user) {
        token.sub = user.id;
      }
      console.log("JWT callback, token:", token);
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }: { user: User; account: Account | null; profile?: Profile; isNewUser?: boolean }) {
      const req = account?.providerAccountId ? { headers: { "user-agent": "unknown" } } : null; // Adjust as needed
      // This event fires on successful sign-in.
      // We can attempt to update the session here or shortly after.
      // However, the session might not be fully created *yet* when this runs.
      // A more reliable way might be needed if this proves insufficient.
      console.log('signIn event', { userId: user.id });
      // We need the session token to update the correct session.
      // This event doesn't directly provide the session token being created.
      // Let's try updating the *latest* session for the user, assuming it's the one just created.
      // This is a potential race condition if multiple logins happen simultaneously.

      const userAgent = req?.headers?.["user-agent"] || null;

      if (userAgent && user.id) {
        try {
          // Find the most recently created session for this user
          const latestSession = await prisma.session.findFirst({
            where: { userId: user.id },
            orderBy: { expires: 'desc' }, // Assuming expires reflects creation order closely
          });

          if (latestSession) {
            await prisma.session.update({
              where: { sessionToken: latestSession.sessionToken }, // Use sessionToken as the unique identifier
              data: { userAgent: userAgent },
            });
            console.log(`Updated userAgent for session: ${latestSession.sessionToken}`);
          } else {
            console.log('No session found to update userAgent for user:', user.id);
          }
        } catch (error) {
          console.error("Error updating session with userAgent:", error);
        }
      }
    },
    // Add other events like signOut, createUser, updateUser, linkAccount if needed
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
