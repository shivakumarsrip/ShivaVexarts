import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, artworks } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const orderRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        shippingAddress: z.string().optional(),
        shippingCity: z.string().optional(),
        shippingCountry: z.string().optional(),
        totalAmount: z.number().int().positive(),
        shippingCost: z.number().int().default(0),
        items: z.array(
          z.object({
            artworkId: z.number(),
            size: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().int().positive(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const orderId = "VEX-" + Date.now().toString(36).toUpperCase();

      const [order] = await db.insert(orders).values({
        orderId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingCity,
        shippingCountry: input.shippingCountry,
        totalAmount: input.totalAmount,
        shippingCost: input.shippingCost,
        status: "pending",
      }).returning({ id: orders.id });

      const orderIdNum = order.id;

      for (const item of input.items) {
        const artwork = await db.select().from(artworks).where(eq(artworks.id, item.artworkId));
        const artworkTitle = artwork[0]?.title || "Unknown";
        const artworkImage = artwork[0]?.image || "";

        await db.insert(orderItems).values({
          orderId: orderIdNum,
          artworkId: item.artworkId,
          artworkTitle,
          artworkImage,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        });
      }

      return { orderId, id: orderIdNum };
    }),

  verifyPayment: publicQuery
    .input(
      z.object({
        orderId: z.string(),
        paymentRef: z.string(),
        paymentMethod: z.string().default("khalti"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(orders)
        .set({
          status: "paid",
          paymentRef: input.paymentRef,
          paymentMethod: input.paymentMethod,
        })
        .where(eq(orders.orderId, input.orderId));

      return { success: true };
    }),

  myOrders: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, ctx.user.id))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = [];
    for (const order of userOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      ordersWithItems.push({ ...order, items });
    }

    return ordersWithItems;
  }),

  getByOrderId: publicQuery
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const orderResults = await db.select().from(orders).where(eq(orders.orderId, input.orderId));
      if (!orderResults[0]) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderResults[0].id));

      return { ...orderResults[0], items };
    }),

  listAll: adminQuery.query(async () => {
    const db = getDb();
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    const ordersWithItems = [];
    for (const order of allOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      ordersWithItems.push({ ...order, items });
    }

    return ordersWithItems;
  }),

  updateStatus: adminQuery
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.orderId, input.orderId));
      return { success: true };
    }),
});
