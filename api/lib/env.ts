import "dotenv/config";

// Simple and direct environment variable access for Vercel/Node.js/Local
export const env = {
  get jwtSecret() {
    return process.env.JWT_SECRET || "";
  },
  get adminEmail() {
    return (process.env.ADMIN_EMAIL || "").toLowerCase();
  },
  get isProduction() {
    return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  },
  get databaseUrl() {
    return process.env.DATABASE_URL || "";
  },
};
