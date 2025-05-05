import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      role_id?: number;
      is_admin?: boolean;
      permissions?: string[];
    }
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string | null;
    role_id: number | null;
    is_admin: boolean;
    permissions: string[];
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    mobileNumber?: string;
    accessToken?: string;
  }
} 