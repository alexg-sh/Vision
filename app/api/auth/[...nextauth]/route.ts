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
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom sign out page
    // verifyRequest: '/auth/verify-request', // Optional: Email verification page
    // newUser: '/auth/new-user' // Optional: New user page
  },
  session: {
    strategy: "jwt", // Revert back to JWT strategy for CredentialsProvider
    // maxAge and updateAge are less relevant for JWT strategy unless using sliding sessions
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to the JWT token on initial sign in
      if (user) {
        token.sub = user.id; // 'sub' is the standard JWT claim for subject (user ID)
        // You could add other user properties here if needed, e.g., token.role = user.role;
      }
      console.log("JWT callback (strategy=jwt), token:", token);
      return token;
    },
    async session({ session, token }) {
      // Add user ID from the JWT token (sub claim) to the session object
      if (token && session.user) {
        session.user.id = token.sub as string; // Ensure ID is added to the session
        // Add other properties from token if needed: session.user.role = token.role;
      }
      console.log("Session callback (strategy=jwt), session:", session);
      return session;
    },
  },
  events: {
    // The signIn event logic might need adjustment if you were relying on DB session
    // For JWT, there's no DB session created automatically by NextAuth to update.
    // If you still need userAgent tracking, you'd need a custom solution.
    async signIn({ user, account, profile, isNewUser }: { user: User; account: Account | null; profile?: Profile; isNewUser?: boolean }) {
      // This event fires on successful sign-in.
      console.log('signIn event (JWT strategy)', { userId: user.id });
      // Original userAgent update logic is removed as it targeted DB sessions.
      // If needed, implement custom DB logging here based on user.id and request headers.
    },
    // Add other events like signOut, createUser, updateUser, linkAccount if needed
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
