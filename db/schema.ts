import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const collectionEnum = pgEnum("collection", [
  "portraits",
  "fan_art",
  "posters",
  "illustrations",
  "devotional",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

// ── Tables ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  collection: collectionEnum("collection").notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }).notNull(),
  basePrice: integer("base_price").notNull(),
  year: integer("year").default(2024),
  dimensions: varchar("dimensions", { length: 100 }),
  format: varchar("format", { length: 50 }),
  featured: integer("featured").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = typeof artworks.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(),
  userId: bigint("user_id", { mode: "number" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  shippingAddress: text("shipping_address"),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingCountry: varchar("shipping_country", { length: 100 }),
  totalAmount: integer("total_amount").notNull(),
  shippingCost: integer("shipping_cost").default(0),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentRef: varchar("payment_ref", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  artworkId: bigint("artwork_id", { mode: "number" }).notNull(),
  artworkTitle: varchar("artwork_title", { length: 255 }).notNull(),
  artworkImage: varchar("artwork_image", { length: 500 }),
  size: varchar("size", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
