import { z } from "zod";
import { createRouter, authedQuery, brandQuery, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brandSubscriptions, creatorSubscriptions } from "@db/schema";
import { eq } from "drizzle-orm";

// ─── Plan Definitions (Source of Truth) ───
export const BRAND_PLANS = {
  free: {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    commissionRate: 15, // 15% per deal
    maxActiveCampaigns: 1,
    aiMatching: false,
    roiTracking: false,
    affiliate: false,
    featuredCampaigns: false,
    analytics: false,
  },
  growth: {
    name: "Growth",
    monthlyPrice: 2999,
    annualPrice: 29990,
    commissionRate: 10,
    maxActiveCampaigns: 5,
    aiMatching: true,
    roiTracking: false,
    affiliate: false,
    featuredCampaigns: true,
    analytics: true,
  },
  pro: {
    name: "Pro",
    monthlyPrice: 7999,
    annualPrice: 79990,
    commissionRate: 8,
    maxActiveCampaigns: 999,
    aiMatching: true,
    roiTracking: true,
    affiliate: true,
    featuredCampaigns: true,
    analytics: true,
  },
  enterprise: {
    name: "Enterprise",
    monthlyPrice: 24999,
    annualPrice: 249990,
    commissionRate: 5,
    maxActiveCampaigns: 999,
    aiMatching: true,
    roiTracking: true,
    affiliate: true,
    featuredCampaigns: true,
    analytics: true,
  },
};

export const CREATOR_PLANS = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    verifiedBadge: false,
    mediaKit: false,
    featured: false,
    priorityMatching: false,
    taxInvoices: false,
    earlyAccess: false,
  },
  verified: {
    name: "Verified",
    monthlyPrice: 499,
    annualPrice: 4990,
    verifiedBadge: true,
    mediaKit: true,
    featured: false,
    priorityMatching: true,
    taxInvoices: false,
    earlyAccess: false,
  },
  pro: {
    name: "Pro Creator",
    monthlyPrice: 999,
    annualPrice: 9990,
    verifiedBadge: true,
    mediaKit: true,
    featured: true,
    priorityMatching: true,
    taxInvoices: true,
    earlyAccess: true,
  },
};

export const FEATURED_PRICES = {
  top_of_feed: { price: 499, label: "Featured in Feed", duration: 7 },
  urgent_badge: { price: 299, label: "Urgent Badge", duration: 7 },
  home_hero: { price: 1999, label: "Homepage Hero", duration: 7 },
  email_blast: { price: 1999, label: "Email to Creators", duration: 1 },
  push_notification: { price: 499, label: "Push Notification", duration: 1 },
};

export const BARTER_PRICES = {
  basic: { price: 99, slots: 1, duration: 14 },
  standard: { price: 299, slots: 5, duration: 7 },
  premium: { price: 499, slots: 10, duration: 14 },
};

export const pricingRouter = createRouter({
  // ─── PUBLIC: Get all pricing ───
  getPlans: publicQuery.query(async () => {
    return {
      brand: BRAND_PLANS,
      creator: CREATOR_PLANS,
      featured: FEATURED_PRICES,
      barter: BARTER_PRICES,
      commission: {
        dealRate: 10, // base commission
        affiliateOverride: 2.5, // platform takes 2.5% of affiliate commission
        instantPayoutFee: 2, // 2% for instant payout
        contentLicense: {
          oneMonthSocial: 499,
          threeMonthDigital: 1999,
          oneYearFull: 4999,
          perpetual: 9999,
        },
      },
    };
  }),

  // ─── BRAND: Get my subscription ───
  myBrandSubscription: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [sub] = await db
      .select()
      .from(brandSubscriptions)
      .where(eq(brandSubscriptions.brandId, ctx.user.id));
    if (!sub) return { plan: "free", status: "trial", features: BRAND_PLANS.free };
    const planKey = sub.plan as keyof typeof BRAND_PLANS;
    return { ...sub, features: BRAND_PLANS[planKey] ?? BRAND_PLANS.free };
  }),

  // ─── BRAND: Subscribe to a plan ───
  subscribeBrand: brandQuery
    .input(z.object({ plan: z.enum(["growth", "pro", "enterprise"]), billing: z.enum(["monthly", "annual"]).default("monthly") }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const planDef = BRAND_PLANS[input.plan];
      if (!planDef) throw new Error("Invalid plan");

      const price = input.billing === "annual" ? planDef.annualPrice : planDef.monthlyPrice;
      const now = new Date();
      const periodEnd = new Date(now);
      if (input.billing === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const [existing] = await db
        .select()
        .from(brandSubscriptions)
        .where(eq(brandSubscriptions.brandId, ctx.user.id));

      if (existing) {
        await db.update(brandSubscriptions).set({
          plan: input.plan,
          monthlyPrice: price.toString(),
          commissionRate: planDef.commissionRate.toString(),
          maxActiveCampaigns: planDef.maxActiveCampaigns,
          canUseAiMatching: planDef.aiMatching,
          canUseRoiTracking: planDef.roiTracking,
          canUseAffiliate: planDef.affiliate,
          canFeatureCampaigns: planDef.featuredCampaigns,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: (parseFloat(existing.totalSubscriptionPaid?.toString() ?? "0") + price).toString(),
        }).where(eq(brandSubscriptions.brandId, ctx.user.id));
      } else {
        await db.insert(brandSubscriptions).values({
          brandId: ctx.user.id,
          plan: input.plan,
          monthlyPrice: price.toString(),
          commissionRate: planDef.commissionRate.toString(),
          maxActiveCampaigns: planDef.maxActiveCampaigns,
          canUseAiMatching: planDef.aiMatching,
          canUseRoiTracking: planDef.roiTracking,
          canUseAffiliate: planDef.affiliate,
          canFeatureCampaigns: planDef.featuredCampaigns,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: price.toString(),
        });
      }
      return { success: true, plan: input.plan, amount: price };
    }),

  // ─── CREATOR: Get my subscription ───
  myCreatorSubscription: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [sub] = await db
      .select()
      .from(creatorSubscriptions)
      .where(eq(creatorSubscriptions.creatorId, ctx.user.id));
    if (!sub) return { plan: "free", status: "trial", features: CREATOR_PLANS.free };
    const planKey = sub.plan as keyof typeof CREATOR_PLANS;
    return { ...sub, features: CREATOR_PLANS[planKey] ?? CREATOR_PLANS.free };
  }),

  // ─── CREATOR: Subscribe to a plan ───
  subscribeCreator: influencerQuery
    .input(z.object({ plan: z.enum(["verified", "pro"]), billing: z.enum(["monthly", "annual"]).default("monthly") }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const planDef = CREATOR_PLANS[input.plan];
      if (!planDef) throw new Error("Invalid plan");

      const price = input.billing === "annual" ? planDef.annualPrice : planDef.monthlyPrice;
      const now = new Date();
      const periodEnd = new Date(now);
      if (input.billing === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const [existing] = await db
        .select()
        .from(creatorSubscriptions)
        .where(eq(creatorSubscriptions.creatorId, ctx.user.id));

      if (existing) {
        await db.update(creatorSubscriptions).set({
          plan: input.plan,
          monthlyPrice: price.toString(),
          hasVerifiedBadge: planDef.verifiedBadge,
          hasMediaKit: planDef.mediaKit,
          canGetFeatured: planDef.featured,
          canGetPriorityMatching: planDef.priorityMatching,
          canGetTaxInvoices: planDef.taxInvoices,
          earlyAccessCampaigns: planDef.earlyAccess,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: (parseFloat(existing.totalSubscriptionPaid?.toString() ?? "0") + price).toString(),
        }).where(eq(creatorSubscriptions.creatorId, ctx.user.id));
      } else {
        await db.insert(creatorSubscriptions).values({
          creatorId: ctx.user.id,
          plan: input.plan,
          monthlyPrice: price.toString(),
          hasVerifiedBadge: planDef.verifiedBadge,
          hasMediaKit: planDef.mediaKit,
          canGetFeatured: planDef.featured,
          canGetPriorityMatching: planDef.priorityMatching,
          canGetTaxInvoices: planDef.taxInvoices,
          earlyAccessCampaigns: planDef.earlyAccess,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          totalSubscriptionPaid: price.toString(),
        });
      }
      return { success: true, plan: input.plan, amount: price };
    }),

  // ─── ADMIN: Get platform revenue stats ───
  adminRevenueStats: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    const brandSubs = await db.select().from(brandSubscriptions);
    const creatorSubs = await db.select().from(creatorSubscriptions);
    const totalBrandRevenue = brandSubs.reduce((s, b) => s + parseFloat(b.totalSubscriptionPaid?.toString() ?? "0"), 0);
    const totalCreatorRevenue = creatorSubs.reduce((s, c) => s + parseFloat(c.totalSubscriptionPaid?.toString() ?? "0"), 0);
    const totalCommission = brandSubs.reduce((s, b) => s + parseFloat(b.totalCommissionPaid?.toString() ?? "0"), 0);
    return {
      totalBrandSubscribers: brandSubs.filter((b) => b.status === "active" && b.plan !== "free").length,
      totalCreatorSubscribers: creatorSubs.filter((c) => c.status === "active" && c.plan !== "free").length,
      totalBrandRevenue,
      totalCreatorRevenue,
      totalCommission,
      totalRevenue: totalBrandRevenue + totalCreatorRevenue + totalCommission,
    };
  }),
});
