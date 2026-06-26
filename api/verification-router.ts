import { z } from "zod";
import { createRouter, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { creatorSubscriptions, influencerProfiles } from "@db/schema";
import { eq } from "drizzle-orm";

export const verificationRouter = createRouter({
  // ─── Public: Check if a creator is verified ───
  isVerified: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [sub] = await db
        .select()
        .from(creatorSubscriptions)
        .where(eq(creatorSubscriptions.creatorId, input.userId));
      return {
        isVerified: sub?.hasVerifiedBadge ?? false,
        plan: sub?.plan ?? "free",
        status: sub?.status ?? "trial",
      };
    }),

  // ─── Influencer: My verification status ───
  myStatus: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [sub] = await db
      .select()
      .from(creatorSubscriptions)
      .where(eq(creatorSubscriptions.creatorId, ctx.user.id));
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, ctx.user.id));

    return {
      isVerified: sub?.hasVerifiedBadge ?? false,
      plan: sub?.plan ?? "free",
      status: sub?.status ?? "trial",
      igOverallScore: profile?.igOverallScore ?? 0,
      igOverallRating: profile?.igOverallRating ?? "—",
      igFakeFollowerPercentage: profile?.igFakeFollowerPercentage ?? 0,
      followerQualityRating: profile?.igFollowerQualityRating ?? "—",
    };
  }),

  // ─── Influencer: Purchase verification badge ───
  purchaseBadge: influencerQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const price = 499;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [existing] = await db
      .select()
      .from(creatorSubscriptions)
      .where(eq(creatorSubscriptions.creatorId, ctx.user.id));

    if (existing) {
      // Already has a paid plan
      if (existing.plan !== "free" && existing.status === "active") {
        return { success: true, message: "Already subscribed to " + existing.plan, plan: existing.plan };
      }
      // Upgrade from free
      await db
        .update(creatorSubscriptions)
        .set({
          plan: "verified",
          monthlyPrice: price.toString(),
          hasVerifiedBadge: true,
          hasMediaKit: true,
          canGetPriorityMatching: true,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: (parseFloat(existing.totalSubscriptionPaid?.toString() ?? "0") + price).toString(),
        })
        .where(eq(creatorSubscriptions.creatorId, ctx.user.id));
    } else {
      await db.insert(creatorSubscriptions).values({
        creatorId: ctx.user.id,
        plan: "verified",
        monthlyPrice: price.toString(),
        hasVerifiedBadge: true,
        hasMediaKit: true,
        canGetPriorityMatching: true,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        totalSubscriptionPaid: price.toString(),
      });
    }

    return { success: true, plan: "verified", amount: price };
  }),

  // ─── Influencer: Upgrade to Pro ───
  upgradePro: influencerQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const price = 999;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [existing] = await db
      .select()
      .from(creatorSubscriptions)
      .where(eq(creatorSubscriptions.creatorId, ctx.user.id));

    if (existing) {
      await db
        .update(creatorSubscriptions)
        .set({
          plan: "pro",
          monthlyPrice: price.toString(),
          hasVerifiedBadge: true,
          hasMediaKit: true,
          canGetFeatured: true,
          canGetPriorityMatching: true,
          canGetTaxInvoices: true,
          earlyAccessCampaigns: true,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: (parseFloat(existing.totalSubscriptionPaid?.toString() ?? "0") + price).toString(),
        })
        .where(eq(creatorSubscriptions.creatorId, ctx.user.id));
    } else {
      await db.insert(creatorSubscriptions).values({
        creatorId: ctx.user.id,
        plan: "pro",
        monthlyPrice: price.toString(),
        hasVerifiedBadge: true,
        hasMediaKit: true,
        canGetFeatured: true,
        canGetPriorityMatching: true,
        canGetTaxInvoices: true,
        earlyAccessCampaigns: true,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        totalSubscriptionPaid: price.toString(),
      });
    }

    return { success: true, plan: "pro", amount: price };
  }),
});
