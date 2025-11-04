import { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

// Admin credentials - these should match what the customer provided
const ADMIN_USERNAME = "dulcemono";
const ADMIN_PASSWORD = "8987R)Wz]5>f";

// Session token name for admin authentication
const ADMIN_SESSION_COOKIE = "marvel_rivals_admin_session";

// Simple hash function for session tokens
function generateSessionToken(): string {
  return crypto.randomUUID() + "-" + Date.now().toString(36);
}

// Verify admin credentials
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

// Admin authentication middleware
export const adminAuthMiddleware = createMiddleware(async (c: Context, next) => {
  console.log("Admin auth middleware triggered");
  
  const sessionToken = getCookie(c, ADMIN_SESSION_COOKIE);
  console.log("Session token:", sessionToken ? "present" : "missing");
  
  if (!sessionToken) {
    console.log("No session token found");
    return c.json({ error: "Admin authentication required" }, 401);
  }

  // In a real app, you'd validate the session token against a database
  // For this simple case, we'll use a basic time-based validation
  try {
    // Find the last dash (timestamp is after the last dash)
    const lastDashIndex = sessionToken.lastIndexOf("-");
    if (lastDashIndex === -1) {
      console.log("Invalid token format - no timestamp separator");
      throw new Error("Invalid token format");
    }
    
    const timestampPart = sessionToken.substring(lastDashIndex + 1);
    const timestamp = parseInt(timestampPart, 36);
    
    if (isNaN(timestamp)) {
      console.log("Invalid token format - timestamp not a number");
      throw new Error("Invalid token format");
    }
    
    const currentTime = Date.now();
    const tokenAge = currentTime - timestamp;
    
    console.log("Token age:", tokenAge, "Max age:", 86400000);
    
    // Token expires after 24 hours (86400000 ms)
    if (tokenAge > 86400000) {
      console.log("Token expired");
      throw new Error("Token expired");
    }
    
    console.log("Auth successful, proceeding...");
    await next();
  } catch (error) {
    console.log("Auth error:", error);
    
    // Get the request URL to determine if we're in production
    const url = new URL(c.req.url);
    const isProduction = url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1');
    
    // Clear invalid cookie
    setCookie(c, ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 0,
      path: "/"
    });
    
    return c.json({ error: "Invalid or expired session" }, 401);
  }
});

// Create admin session
export function createAdminSession(c: Context): string {
  const sessionToken = generateSessionToken();
  
  // Get the request URL to determine if we're in production
  const url = new URL(c.req.url);
  const isProduction = url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1');
  
  setCookie(c, ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax", // Changed for better cross-origin support
    maxAge: 86400, // 24 hours
    path: "/"
  });
  
  return sessionToken;
}

// Clear admin session
export function clearAdminSession(c: Context): void {
  // Get the request URL to determine if we're in production
  const url = new URL(c.req.url);
  const isProduction = url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1');
  
  setCookie(c, ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    maxAge: 0,
    path: "/"
  });
}
