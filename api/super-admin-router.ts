import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users, influencerProfiles, brandProfiles, campaigns, campaignApplications,
  payments, brandSubscriptions, creatorSubscriptions, platformFees,
  notifications, barterDeals, negotiationSessions,
  creditScores,
} from "@db/schema";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

// Helper: get current month string
function getMonthStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const superAdminRouter = createRouter({
  // ─── PLATFORM OVERVIEW ───
  getOverview: adminQuery.query(async () => {
    const db = getDb();

    // User counts
    const [userCounts] = await db.select({
      total: count(),
      brands: sql<number>`SUM(CASE WHEN role = 'brand' THEN 1 ELSE 0 END)`,
      influencers: sql<number>`SUM(CASE WHEN role = 'influencer' THEN 1 ELSE 0 END)`,
      admins: sql<number>`SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END)`,
    }).from(users);

    // New users this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [newThisMonth] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, monthStart));
    const [newBrands] = await db.select({ count: count() }).from(users).where(and(eq(users.role, "brand"), gte(users.createdAt, monthStart)));
    const [newInfluencers] = await db.select({ count: count() }).from(users).where(and(eq(users.role, "influencer"), gte(users.createdAt, monthStart)));

    // Revenue
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments);
    const [gstTotal] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.gstAmount}), 0)` }).from(payments);
    const [commissionRev] = await db.select({ total: sql<number>`COALESCE(SUM(${platformFees.feeAmount}), 0)` }).from(platformFees).where(eq(platformFees.feeType, "commission_deal"));
    const [subRev] = await db.select({ total: sql<number>`COALESCE(SUM(${platformFees.feeAmount}), 0)` }).from(platformFees).where(eq(platformFees.feeType, "brand_subscription"));

    // Campaigns
    const [campaignCounts] = await db.select({
      total: count(),
      active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
      completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
    }).from(campaigns);

    // Subscriptions
    const [brandSubs] = await db.select({ count: count() }).from(brandSubscriptions).where(eq(brandSubscriptions.status, "active"));
    const [creatorSubs] = await db.select({ count: count() }).from(creatorSubscriptions).where(eq(creatorSubscriptions.status, "active"));
    const [failedPayments] = await db.select({ count: count() }).from(brandSubscriptions).where(eq(brandSubscriptions.lastPaymentStatus, "failed"));

    // Payments by status
    const [escrowCount] = await db.select({ count: count() }).from(payments).where(eq(payments.status, "escrow"));
    const [releasedCount] = await db.select({ count: count() }).from(payments).where(eq(payments.status, "released"));

    // Pending approvals
    const [pendingApps] = await db.select({ count: count() }).from(campaignApplications).where(eq(campaignApplications.status, "pending"));
    const [pendingBarter] = await db.select({ count: count() }).from(barterDeals).where(eq(barterDeals.status, "open"));
    const [activeNegotiations] = await db.select({ count: count() }).from(negotiationSessions).where(eq(negotiationSessions.status, "ai_negotiating"));

    return {
      users: {
        total: userCounts?.total ?? 0,
        brands: userCounts?.brands ?? 0,
        influencers: userCounts?.influencers ?? 0,
        newThisMonth: newThisMonth?.count ?? 0,
        newBrandsThisMonth: newBrands?.count ?? 0,
        newInfluencersThisMonth: newInfluencers?.count ?? 0,
      },
      revenue: {
        total: revenue?.total ?? 0,
        gstCollected: gstTotal?.total ?? 0,
        commission: commissionRev?.total ?? 0,
        subscriptions: subRev?.total ?? 0,
      },
      campaigns: {
        total: campaignCounts?.total ?? 0,
        active: campaignCounts?.active ?? 0,
        completed: campaignCounts?.completed ?? 0,
      },
      subscriptions: {
        activeBrandSubs: brandSubs?.count ?? 0,
        activeCreatorSubs: creatorSubs?.count ?? 0,
        failedPayments: failedPayments?.count ?? 0,
      },
      payments: {
        total: revenue?.total ?? 0,
        inEscrow: escrowCount?.count ?? 0,
        released: releasedCount?.count ?? 0,
      },
      pending: {
        applications: pendingApps?.count ?? 0,
        barterDeals: pendingBarter?.count ?? 0,
        negotiations: activeNegotiations?.count ?? 0,
      },
    };
  }),

  // ─── MONTHLY GROWTH DATA ───
  getMonthlyGrowth: adminQuery.query(async () => {
    const db = getDb();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(getMonthStr(d));
    }

    const monthlyData = [];
    for (const month of months) {
      const monthStart = new Date(`${month}-01`);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [newUsers] = await db.select({ count: count() }).from(users)
        .where(and(gte(users.createdAt, monthStart), lte(users.createdAt, monthEnd)));
      const [newBrands] = await db.select({ count: count() }).from(users)
        .where(and(eq(users.role, "brand"), gte(users.createdAt, monthStart), lte(users.createdAt, monthEnd)));
      const [newInfluencers] = await db.select({ count: count() }).from(users)
        .where(and(eq(users.role, "influencer"), gte(users.createdAt, monthStart), lte(users.createdAt, monthEnd)));
      const [monthRevenue] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments)
        .where(and(gte(payments.createdAt, monthStart), lte(payments.createdAt, monthEnd)));
      const [newCampaigns] = await db.select({ count: count() }).from(campaigns)
        .where(and(gte(campaigns.createdAt, monthStart), lte(campaigns.createdAt, monthEnd)));
      const [newSubs] = await db.select({ count: count() }).from(brandSubscriptions)
        .where(and(gte(brandSubscriptions.createdAt, monthStart), lte(brandSubscriptions.createdAt, monthEnd), eq(brandSubscriptions.status, "active")));

      monthlyData.push({
        month,
        newUsers: newUsers?.count ?? 0,
        newBrands: newBrands?.count ?? 0,
        newInfluencers: newInfluencers?.count ?? 0,
        revenue: monthRevenue?.total ?? 0,
        newCampaigns: newCampaigns?.count ?? 0,
        newSubscriptions: newSubs?.count ?? 0,
      });
    }

    // Calculate MoM growth rates
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    const userGrowth = previous && previous.newUsers > 0 ? ((current.newUsers - previous.newUsers) / previous.newUsers * 100).toFixed(1) : "0";
    const revenueGrowth = previous && previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1) : "0";

    return { monthlyData, userGrowth, revenueGrowth };
  }),

  // ─── ALL USERS (with profiles) ───
  getAllUsers: adminQuery
    .input(z.object({
      role: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      const offset = ((input?.page ?? 1) - 1) * limit;

      const conditions = input?.role ? eq(users.role, input.role as any) : undefined;

      const allUsers = conditions
        ? await db.select().from(users).where(conditions).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
        : await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

      // Enrich with profiles
      const enriched = await Promise.all(allUsers.map(async (u) => {
        let profile = null;
        let subscription = null;
        if (u.role === "brand") {
          const [p] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, u.id));
          const [s] = await db.select().from(brandSubscriptions).where(eq(brandSubscriptions.brandId, u.id));
          profile = p; subscription = s;
        } else if (u.role === "influencer") {
          const [p] = await db.select().from(influencerProfiles).where(eq(influencerProfiles.userId, u.id));
          const [s] = await db.select().from(creatorSubscriptions).where(eq(creatorSubscriptions.creatorId, u.id));
          profile = p; subscription = s;
        }
        return { ...u, profile, subscription };
      }));

      return enriched;
    }),

  // ─── ALL PAYMENTS ───
  getAllPayments: adminQuery
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      const offset = ((input?.page ?? 1) - 1) * limit;

      const conditions = input?.status ? eq(payments.status, input.status as any) : undefined;
      const result = conditions
        ? await db.select().from(payments).where(conditions).orderBy(desc(payments.createdAt)).limit(limit).offset(offset)
        : await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit).offset(offset);

      return result;
    }),

  // ─── ALL CAMPAIGNS ───
  getAllCampaigns: adminQuery
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      const offset = ((input?.page ?? 1) - 1) * limit;

      const conditions = input?.status ? eq(campaigns.status, input.status as any) : undefined;
      const result = conditions
        ? await db.select().from(campaigns).where(conditions).orderBy(desc(campaigns.createdAt)).limit(limit).offset(offset)
        : await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(limit).offset(offset);

      return result;
    }),

  // ─── UPDATE USER ROLE ───
  updateUserRole: adminQuery
    .input(z.object({ userId: z.number(), role: z.enum(["user", "brand", "influencer", "admin"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role, updatedAt: new Date() }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ─── APPROVE/REJECT CAMPAIGN ───
  moderateCampaign: adminQuery
    .input(z.object({ campaignId: z.number(), action: z.enum(["approve", "reject", "pause"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const statusMap = { approve: "active", reject: "cancelled", pause: "paused" };
      await db.update(campaigns)
        .set({ status: statusMap[input.action] as any, updatedAt: new Date() })
        .where(eq(campaigns.id, input.campaignId));
      return { success: true };
    }),

  // ─── MANAGE SUBSCRIPTIONS ───
  getAllSubscriptions: adminQuery.query(async () => {
    const db = getDb();
    const bSubs = await db.select().from(brandSubscriptions).orderBy(desc(brandSubscriptions.createdAt));
    const cSubs = await db.select().from(creatorSubscriptions).orderBy(desc(creatorSubscriptions.createdAt));

    // Enrich with user data
    const enrichedBrandSubs = await Promise.all(bSubs.map(async (s) => {
      const [u] = await db.select().from(users).where(eq(users.id, s.brandId));
      return { ...s, user: u };
    }));
    const enrichedCreatorSubs = await Promise.all(cSubs.map(async (s) => {
      const [u] = await db.select().from(users).where(eq(users.id, s.creatorId));
      return { ...s, user: u };
    }));

    return { brandSubs: enrichedBrandSubs, creatorSubs: enrichedCreatorSubs };
  }),

  // ─── FORCE DOWNGRADE SUBSCRIPTION ───
  forceDowngrade: adminQuery
    .input(z.object({ userId: z.number(), userType: z.enum(["brand", "creator"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const table = input.userType === "brand" ? brandSubscriptions : creatorSubscriptions;
      const idField = input.userType === "brand" ? brandSubscriptions.brandId : creatorSubscriptions.creatorId;

      await db.update(table).set({
        plan: "free",
        status: "expired",
        downgradeScheduledAt: new Date(),
      }).where(eq(idField as any, input.userId));

      await db.insert(notifications).values({
        userId: input.userId,
        type: "subscription_downgraded",
        title: "Subscription Downgraded by Admin",
        message: "Your subscription has been downgraded by the platform admin. Contact support for assistance.",
      });

      return { success: true };
    }),

  // ─── PLATFORM REVENUE ANALYTICS ───
  getRevenueBreakdown: adminQuery.query(async () => {
    const db = getDb();

    // Revenue by type
    const byType = await db.select({
      feeType: platformFees.feeType,
      total: sql<number>`COALESCE(SUM(${platformFees.feeAmount}), 0)`,
      count: count(),
    }).from(platformFees).groupBy(platformFees.feeType);

    // Revenue by month (last 6)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const [rev] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments).where(and(gte(payments.createdAt, start), lte(payments.createdAt, end)));
      const [gst] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.gstAmount}), 0)` })
        .from(payments).where(and(gte(payments.createdAt, start), lte(payments.createdAt, end)));
      monthlyRevenue.push({
        month: getMonthStr(d),
        revenue: rev?.total ?? 0,
        gst: gst?.total ?? 0,
      });
    }

    return { byType, monthlyRevenue };
  }),

  // ─── TOP CREATORS (by Mitraa Score) ───
  getTopCreators: adminQuery.query(async () => {
    const db = getDb();
    const top = await db
      .select()
      .from(creditScores)
      .orderBy(desc(creditScores.overallScore))
      .limit(20);

    const enriched = await Promise.all(top.map(async (s) => {
      const [u] = await db.select().from(users).where(eq(users.id, s.creatorId));
      const [p] = await db.select().from(influencerProfiles).where(eq(influencerProfiles.userId, s.creatorId));
      return { ...s, user: u, profile: p };
    }));

    return enriched;
  }),

  // ─── RECENT ACTIVITY ───
  getRecentActivity: adminQuery.query(async () => {
    const db = getDb();
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(10);
    const recentPayments = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(10);
    const recentCampaigns = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(10);

    return { recentUsers, recentPayments, recentCampaigns };
  }),
});
