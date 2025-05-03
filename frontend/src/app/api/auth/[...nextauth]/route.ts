import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Mobile Number",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.mobileNumber || !credentials?.password) {
          return null;
        }

        try {
          // Make API call to backend for authentication
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              username: credentials.mobileNumber, // Note: API expects username field
              password: credentials.password,
            }
          );

          if (response.data && response.data.access_token) {
            // If we get a token, login is successful
            return {
              id: "1", // Will be properly set in the JWT callback
              mobileNumber: credentials.mobileNumber,
              token: response.data.access_token,
            };
          }
          
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.mobileNumber = user.mobileNumber;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.mobileNumber = token.mobileNumber;
      
      // For authenticated API requests
      session.accessToken = token.accessToken;
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST }; 