// dotenv/config is not needed on Vercel as it injects env vars directly.
// We use a safe accessor to avoid build-time crashes.

function required(name: string): string {
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (!value && typeof process !== 'undefined' && process.env.NODE_ENV === "production") {
    // We only throw if we're actually in a production runtime.
    // Vercel sometimes runs this during build where some env vars might be missing.
    if (process.env.VERCEL) return ""; 
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  adminEmail: (typeof process !== 'undefined' ? process.env.ADMIN_EMAIL ?? "" : "").toLowerCase(),
  isProduction: typeof process !== 'undefined' && process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
};
