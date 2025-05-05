import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ADMIN_ROLE_NAME, ADMIN_PERMISSION, SESSION_MAX_AGE, DEFAULT_API_URL } from "@/constants/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Support both backend container URL and localhost
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
          
          if (!credentials?.mobileNumber || !credentials?.password) {
            throw new Error('Mobile number and password are required');
          }
          
          // Step 1: Login to get access token
          const loginRes = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              username: credentials.mobileNumber,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          const loginData = await loginRes.json();
          
          // If login failed, throw error
          if (!loginRes.ok) {
            throw new Error(loginData.detail || 'Authentication failed');
          }
          
          // Step 2: Get user details with permissions using the token
          const userRes = await fetch(`${apiUrl}/auth/me`, {
            headers: { 
              'Authorization': `Bearer ${loginData.access_token}`
            }
          });
          
          const userData = await userRes.json();
          
          // If we couldn't get user data, throw error
          if (!userRes.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          // Determine admin status based on multiple criteria
          const hasAdminRole = userData.role && userData.role.name === ADMIN_ROLE_NAME;
          const hasAdminPermission = Array.isArray(userData.permissions) && 
                                    userData.permissions.includes(ADMIN_PERMISSION);
          const isAdmin = hasAdminRole || hasAdminPermission || userData.is_admin === true;
          
          // Return combined user data
          return {
            id: userData.id.toString(),
            email: userData.email || '',
            name: userData.mobile_number,
            role: userData.role?.name || null,
            role_id: userData.role_id || null,
            is_admin: isAdmin,
            permissions: userData.permissions || [],
            accessToken: loginData.access_token
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // If the user is being signed in, add their data to the token
      if (user) {
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
    async session({ session, token }) {
      // Add user data from the token to the session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.role_id = token.role_id as number;
        session.user.is_admin = token.is_admin as boolean;
        session.user.permissions = token.permissions as string[];
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 