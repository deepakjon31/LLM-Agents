import { Session } from "next-auth";
import { ADMIN_ROLE_NAME, ADMIN_PERMISSION } from "@/constants/auth";

/**
 * Checks if a user has admin access based on multiple criteria
 * @param user The user object from the session
 * @returns boolean indicating if the user has admin access
 */
export const hasAdminAccess = (user: Session["user"]): boolean => {
  if (!user) return false;
  
  // Check multiple admin criteria
  const hasAdminRole = user.role === ADMIN_ROLE_NAME;
  const hasAdminPermission = Array.isArray(user.permissions) && 
                           user.permissions.includes(ADMIN_PERMISSION);
  const isAdminUser = user.is_admin === true;
  
  // More detailed logging for debugging
  console.debug('Admin access check:', { 
    hasAdminRole, 
    hasAdminPermission, 
    isAdminUser,
    role: user.role,
    permissions: user.permissions
  });
  
  return hasAdminRole || hasAdminPermission || isAdminUser;
};

/**
 * Checks if a session has admin access
 * @param session The session object
 * @returns boolean indicating if the session has admin access
 */
export const sessionHasAdminAccess = (session: Session | null): boolean => {
  if (!session || !session.user) return false;
  return hasAdminAccess(session.user);
}; 