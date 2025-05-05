/**
 * Authentication related constants
 * Used across the application to ensure consistency
 */

// Role names
export const ADMIN_ROLE_NAME = 'admin';
export const USER_ROLE_NAME = 'user';

// Permission names
export const ADMIN_PERMISSION = 'admin_access';
export const READ_PERMISSION = 'read_access';
export const WRITE_PERMISSION = 'write_access';

// Session durations
export const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// Default API URL
export const DEFAULT_API_URL = 'http://localhost:8000'; 