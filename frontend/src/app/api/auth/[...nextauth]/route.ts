import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { ADMIN_ROLE_NAME, ADMIN_PERMISSION } from "@/constants/auth";

// Constants
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INTERNAL_API_URL = process.env.NEXTAUTH_BACKEND_URL_INTERNAL || "http://backend:8000";

// Error handler with better logging
const handleAuthError = (error: any, context: string) => {
  console.error(`[NextAuth] ${context} error:`, error);
  
  if (error.response) {
    console.error(`[NextAuth] Response status: ${error.response.status}`);
    console.error(`[NextAuth] Response data:`, error.response.data);
  } else if (error.request) {
    console.error('[NextAuth] No response received');
  }
  
  return null;
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.mobileNumber || !credentials?.password) {
          console.error("[NextAuth] Missing credentials");
          return null;
        }

        try {
          console.log(`[NextAuth] Attempting login for ${credentials.mobileNumber}`);
          console.log(`[NextAuth] Using API URL: ${INTERNAL_API_URL}`);
          
          // Step 1: Login to get token
          const response = await axios.post(`${INTERNAL_API_URL}/auth/login`, {
            username: credentials.mobileNumber,
            password: credentials.password,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (response.data && response.data.access_token) {
            console.log("[NextAuth] Login successful, token received");
            
            // Get user details from the backend
            const userResponse = await axios.get(`${INTERNAL_API_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${response.data.access_token}`
              },
              timeout: 10000
            });
            
            const userData = userResponse.data;
            
            // Determine admin status based on multiple criteria
            const hasAdminRole = userData.role && userData.role.name === ADMIN_ROLE_NAME;
            const hasAdminPermission = Array.isArray(userData.permissions) && 
                                      userData.permissions.includes(ADMIN_PERMISSION);
            const isAdmin = hasAdminRole || hasAdminPermission || userData.is_admin === true;
            
            console.log("[NextAuth] User data retrieved successfully");
            console.log("[NextAuth] Admin status:", { 
              hasAdminRole, 
              hasAdminPermission, 
              backendIsAdmin: userData.is_admin,
              calculatedIsAdmin: isAdmin 
            });
            
            return {
              id: userData.id.toString(),
              mobileNumber: credentials.mobileNumber,
              email: userData.email || '',
              name: userData.mobile_number,
              role: userData.role?.name || null,
              role_id: userData.role_id || null,
              is_admin: isAdmin,
              permissions: userData.permissions || [],
              accessToken: response.data.access_token
            };
          } else {
            console.error("[NextAuth] No token in response:", response.data);
            return null;
          }
        } catch (error) {
          return handleAuthError(error, 'Login');
        }
      }
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