import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { promotions, userPromotionUsage } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const promotionsRouter = createRouter({
  // ─── Public: Get active promotions ───
  getActive: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const promos = await db
      .select()
      .from(promotions)
      .where(eq(promotions.status, "active"));
    return promos.filter((p) => !p.endsAt || p.endsAt > now);
  }),

  // ─── Check if user can use a promotion ───
  checkEligibility: authedQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [promo] = await db.select().from(promotions).where(eq(promotions.code, input.code));
      if (!promo || promo.status !== "active") return { eligible: false, reason: "Invalid or expired promotion" };

      // Check max uses
      if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) return { eligible: false, reason: "Promotion limit reached" };

      // Check user type
      if (promo.eligibleUserType !== "all" && promo.eligibleUserType !== ctx.user.role) {
        return { eligible: false, reason: "Not eligible for this promotion" };
      }

      // Check per-user limit
      const [usage] = await db
        .select()
        .from(userPromotionUsage)
        .where(and(eq(userPromotionUsage.userId, ctx.user.id), eq(userPromotionUsage.promotionId, promo.id)));

      const usedCount = usage?.usageCount ?? 0;
      if (promo.maxDealsPerUser > 0 && usedCount >= promo.maxDealsPerUser) {
        return { eligible: false, reason: `You've used this promotion ${usedCount} times` };
      }

      return { eligible: true, promotion: promo, usedCount, remainingUses: promo.maxDealsPerUser > 0 ? promo.maxDealsPerUser - usedCount : Infinity };
    }),

  // ─── Record promotion usage ───
  recordUsage: authedQuery
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [promo] = await db.select().from(promotions).where(eq(promotions.code, input.code));
      if (!promo) throw new Error("Promotion not found");

      // Increment promotion uses
      await db
        .update(promotions)
        .set({ currentUses: (promo.currentUses ?? 0) + 1 })
        .where(eq(promotions.id, promo.id));

      // Record user usage
      const [existing] = await db
        .select()
        .from(userPromotionUsage)
        .where(and(eq(userPromotionUsage.userId, ctx.user.id), eq(userPromotionUsage.promotionId, promo.id)));

      if (existing) {
        await db
          .update(userPromotionUsage)
          .set({ usageCount: (existing.usageCount ?? 0) + 1, lastUsedAt: new Date() })
          .where(eq(userPromotionUsage.id, existing.id));
      } else {
        await db.insert(userPromotionUsage).values({
          userId: ctx.user.id,
          promotionId: promo.id,
          usageCount: 1,
        });
      }

      return { success: true };
    }),

  // ─── ADMIN: Create promotion ───
  createPromotion: authedQuery
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      promotionType: z.enum(["zero_commission", "free_subscription", "discounted_commission", "free_verified", "free_featured"]),
      discountValue: z.number().default(0),
      maxUses: z.number().default(0),
      maxDealsPerUser: z.number().default(0),
      eligibleUserType: z.enum(["brand", "influencer", "all"]).default("all"),
      endsAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = getDb();
      await db.insert(promotions).values({
        code: input.code,
        name: input.name,
        description: input.description,
        promotionType: input.promotionType,
        discountValue: input.discountValue.toString(),
        maxUses: input.maxUses,
        maxDealsPerUser: input.maxDealsPerUser,
        eligibleUserType: input.eligibleUserType,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      });
      return { success: true };
    }),

  // ─── ADMIN: Get all promotions ───
  getAll: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    return db.select().from(promotions).orderBy(promotions.createdAt);
  }),

  // ─── ADMIN: Seed Phase 1 promotion ───
  seedPhase1: authedQuery.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();

    // Check if PHASE1 already exists
    const [existing] = await db.select().from(promotions).where(eq(promotions.code, "PHASE1"));
    if (existing) return { success: true, message: "Phase 1 promotion already exists" };

    await db.insert(promotions).values({
      code: "PHASE1",
      name: "Launch Special: 0% Commission on First 3 Campaigns",
      description: "New brands pay zero commission on their first 3 campaigns. Start collaborating risk-free!",
      promotionType: "zero_commission",
      discountValue: "100", // 100% off commission
      maxUses: 0, // unlimited total
      maxDealsPerUser: 3, // 3 per brand
      eligibleUserType: "brand",
      status: "active",
    });

    return { success: true, message: "Phase 1 promotion created successfully" };
  }),
});
