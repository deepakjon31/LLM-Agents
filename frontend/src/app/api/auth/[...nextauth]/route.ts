import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";
import { DEFAULT_API_URL } from "@/constants/auth";

// Simple debug log to confirm this file is loaded with the correct version
console.log("[NextAuth] Loading authentication handler");

// Set API URL based on environment variable with fallback
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
const INTERNAL_API_URL = process.env.NEXTAUTH_BACKEND_URL_INTERNAL || PUBLIC_API_URL; // Use internal URL if available
console.log(`[NextAuth] Using INTERNAL API URL for server-side calls: ${INTERNAL_API_URL}`);

// Define interface for backend error response
interface BackendErrorDetail {
  detail?: string;
}

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
          
          const formData = new URLSearchParams();
          formData.append('username', credentials.mobileNumber);
          formData.append('password', credentials.password);
          
          console.log(`[NextAuth] Sending POST to ${INTERNAL_API_URL}/auth/login`); // Use internal URL
          
          const response = await axios.post(
            `${INTERNAL_API_URL}/auth/login`, // Use internal URL
            formData.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 10000,
              // withCredentials is not typically needed for server-to-server calls like this
              // It's more relevant for browser requests involving cookies/sessions
              // Let's remove it here to avoid potential confusion or issues.
              // withCredentials: true 
            }
          );

          if (response.data && response.data.access_token) {
            console.log("[NextAuth] Login successful, token received");
            
            // Get user details from the backend
            const userResponse = await axios.get(`${INTERNAL_API_URL}/auth/me`, { // Use internal URL
              headers: {
                'Authorization': `Bearer ${response.data.access_token}`
              },
              // withCredentials removed here too
              // withCredentials: true,
              timeout: 10000
            });
            
            const userData = userResponse.data;
            
            return {
              id: userData.id.toString(),
              mobileNumber: credentials.mobileNumber,
              email: userData.email || '',
              name: userData.mobile_number,
              role: userData.role?.name || null,
              role_id: userData.role_id || null,
              is_admin: userData.permissions?.includes('admin_access') || userData.role?.name === 'admin',
              permissions: userData.permissions || [],
              accessToken: response.data.access_token
            };
          } else {
            console.error("[NextAuth] No token in response:", response.data);
            return null;
          }
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<BackendErrorDetail>; // Use interface here
            if (axiosError.response) {
              console.error(`[NextAuth] API error ${axiosError.response.status}:`, 
                axiosError.response.data);
              // Now access 'detail' safely
              const detail = axiosError.response.data?.detail || `Error ${axiosError.response.status}: Login failed`;
              throw new Error(detail);
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
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.role_id = user.role_id;
        token.is_admin = user.is_admin;
        token.permissions = user.permissions;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log("[NextAuth] Setting up session data");
      session.user = session.user || {};
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role;
      session.user.role_id = token.role_id;
      session.user.is_admin = token.is_admin;
      session.user.permissions = token.permissions;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST }; 