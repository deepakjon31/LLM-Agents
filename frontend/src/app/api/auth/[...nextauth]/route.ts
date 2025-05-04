import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";

// Simple debug log to confirm this file is loaded with the correct version
console.log("[NextAuth] Loading authentication handler (FIXED VERSION)");

// Set API URL based on Docker container networking (not environment variables)
const API_URL = 'http://backend:8000';
console.log(`[NextAuth] Using fixed backend URL: ${API_URL}`);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Mobile Number",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.mobileNumber || !credentials?.password) {
          console.error("[NextAuth] Missing credentials");
          return null;
        }

        try {
          console.log(`[NextAuth] Login attempt with mobile: ${credentials.mobileNumber}`);
          
          // Create form data expected by FastAPI's OAuth2PasswordRequestForm
          const formData = new URLSearchParams();
          formData.append('username', credentials.mobileNumber);
          formData.append('password', credentials.password);
          
          console.log(`[NextAuth] Sending POST to ${API_URL}/auth/login`);
          
          const response = await axios.post(
            `${API_URL}/auth/login`,
            formData.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              // Add timeout to prevent hanging requests
              timeout: 5000,
            }
          );

          if (response.data && response.data.access_token) {
            console.log("[NextAuth] Login successful, token received");
            return {
              id: "1",
              mobileNumber: credentials.mobileNumber,
              token: response.data.access_token,
            };
          } else {
            console.error("[NextAuth] No token in response:", response.data);
            return null;
          }
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
              console.error(`[NextAuth] API error ${axiosError.response.status}:`, 
                axiosError.response.data);
              throw new Error(
                axiosError.response.data?.detail || `Error ${axiosError.response.status}: Login failed`
              );
            } else if (axiosError.request) {
              console.error("[NextAuth] Network error - no response from server:", axiosError.message);
              throw new Error("Cannot connect to authentication server. Please try again.");
            } else {
              console.error("[NextAuth] Request setup error:", axiosError.message);
              throw new Error("Login request failed. Please try again.");
            }
          } else {
            console.error("[NextAuth] Non-Axios error:", error);
            throw new Error("Authentication failed. Please try again.");
          }
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        console.log("[NextAuth] Adding user data to token");
        token.mobileNumber = user.mobileNumber;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log("[NextAuth] Setting up session data");
      session.user = session.user || {};
      session.user.mobileNumber = token.mobileNumber;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: true,
});

export { handler as GET, handler as POST }; 