import { config } from "dotenv";

if (!process.env.VERCEL) {
  const mode = process.env.NODE_ENV === "production" ? "production" : "local";
  config({ path: `.env.${mode}` });
  config({ path: ".env" });
}

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
  get blobReadWriteToken() {
    return process.env.BLOB_READ_WRITE_TOKEN || "";
  },
  get publicAssetBaseUrl() {
    return process.env.PUBLIC_ASSET_BASE_URL || process.env.VITE_BLOB_BASE_URL || "";
  },
};

// Startup validation
if (env.isProduction) {
  if (!env.databaseUrl) console.error("[ENV] CRITICAL: DATABASE_URL is not defined!");
  if (!env.jwtSecret) console.error("[ENV] CRITICAL: JWT_SECRET is not defined!");
}
