import { z } from "zod";
import { createRouter, authedQuery, brandQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brandSubscriptions, platformFees, userPromotionUsage, promotions } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Commission Engine ───
// Calculates commission with Phase 1 promotion support
export async function calculateCommission(
  db: any,
  brandId: number,
  dealAmount: number
): Promise<{ commissionRate: number; commissionAmount: number; promotionApplied: boolean; promotionName?: string }> {
  // Check brand subscription
  const [sub] = await db.select().from(brandSubscriptions).where(eq(brandSubscriptions.brandId, brandId));
  let rate = sub ? parseFloat(sub.commissionRate?.toString() ?? "10") : 15;

  // Check Phase 1 promotion: "First 3 campaigns = 0% commission"
  const [promo] = await db
    .select()
    .from(promotions)
    .where(and(eq(promotions.code, "PHASE1"), eq(promotions.status, "active")));

  if (promo) {
    // Check how many deals this brand has done
    const [usage] = await db
      .select()
      .from(userPromotionUsage)
      .where(and(
        eq(userPromotionUsage.userId, brandId),
        eq(userPromotionUsage.promotionId, promo.id)
      ));

    const dealsUsed = usage?.usageCount ?? 0;
    const maxDeals = promo.maxDealsPerUser || 3;

    if (dealsUsed < maxDeals) {
      // Apply 0% commission
      return { commissionRate: 0, commissionAmount: 0, promotionApplied: true, promotionName: promo.name };
    }
  }

  const commissionAmount = Math.round(dealAmount * (rate / 100) * 100) / 100;
  return { commissionRate: rate, commissionAmount, promotionApplied: false };
}

export const commissionRouter = createRouter({
  // ─── Calculate commission for a deal (preview) ───
  previewCommission: brandQuery
    .input(z.object({ amount: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await calculateCommission(db, ctx.user.id, input.amount);
      return {
        dealAmount: input.amount,
        commissionRate: result.commissionRate,
        commissionAmount: result.commissionAmount,
        promotionApplied: result.promotionApplied,
        promotionName: result.promotionName,
        netAmount: input.amount - result.commissionAmount,
      };
    }),

  // ─── Get my commission history ───
  myFees: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const fees = await db
      .select()
      .from(platformFees)
      .where(eq(platformFees.payerUserId, ctx.user.id))
      .orderBy(desc(platformFees.processedAt));
    return fees;
  }),

  // ─── Get total commission paid ───
  myTotalCommission: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [sub] = await db.select().from(brandSubscriptions).where(eq(brandSubscriptions.brandId, ctx.user.id));
    return {
      totalCommissionPaid: parseFloat(sub?.totalCommissionPaid?.toString() ?? "0"),
      totalDealsClosed: sub?.totalDealsClosed ?? 0,
      commissionRate: sub ? parseFloat(sub.commissionRate?.toString() ?? "10") : 15,
    };
  }),

  // ─── ADMIN: All fees log ───
  allFees: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    const fees = await db
      .select()
      .from(platformFees)
      .orderBy(desc(platformFees.processedAt))
      .limit(500);
    return fees;
  }),
});
