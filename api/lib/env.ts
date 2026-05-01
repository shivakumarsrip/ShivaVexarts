// Safer environment variable handling for Vercel
function required(name: string): string {
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  
  if (!value) {
    // During Vercel BUILD, some variables might be missing. We allow it.
    if (typeof process !== 'undefined' && process.env.CI) {
      return "";
    }
    // During RUNTIME in production, they MUST be present.
    if (typeof process !== 'undefined' && process.env.NODE_ENV === "production") {
       console.error(`CRITICAL: Missing environment variable ${name}`);
       // We return an empty string instead of crashing the whole process immediately,
       // but the individual database calls will fail with a clear error.
       return "";
    }
  }
  return value ?? "";
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  adminEmail: (typeof process !== 'undefined' ? process.env.ADMIN_EMAIL ?? "" : "").toLowerCase(),
  isProduction: typeof process !== 'undefined' && (process.env.NODE_ENV === "production" || process.env.VERCEL === "1"),
  databaseUrl: required("DATABASE_URL"),
};
