import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, brandProfiles, influencerProfiles, campaigns, campaignApplications } from "@db/schema";
import { eq, count, sql } from "drizzle-orm";

export const adminRouter = createRouter({
  getStats: adminQuery.query(async () => {
    const db = getDb();
    
    const [userCount] = await db.select({ value: count() }).from(users);
    const [brandCount] = await db.select({ value: count() }).from(brandProfiles);
    const [influencerCount] = await db.select({ value: count() }).from(influencerProfiles);
    const [campaignCount] = await db.select({ value: count() }).from(campaigns);
    const [applicationCount] = await db.select({ value: count() }).from(campaignApplications);

    const userRoleCounts = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);

    return {
      totalUsers: userCount.value,
      totalBrands: brandCount.value,
      totalInfluencers: influencerCount.value,
      totalCampaigns: campaignCount.value,
      totalApplications: applicationCount.value,
      userRoleDistribution: userRoleCounts,
    };
  }),

  listUsers: adminQuery.query(async () => {
    const db = getDb();
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        onboardingComplete: users.onboardingComplete,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`);
    return allUsers;
  }),

  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "brand", "influencer", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  listCampaigns: adminQuery.query(async () => {
    const db = getDb();
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .orderBy(sql`${campaigns.createdAt} DESC`);
    return allCampaigns;
  }),

  approveBrand: adminQuery
    .input(z.object({ brandId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(brandProfiles)
        .set({ verified: true })
        .where(eq(brandProfiles.id, input.brandId));
      return { success: true };
    }),

  approveInfluencer: adminQuery
    .input(z.object({ influencerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(influencerProfiles)
        .set({ verified: true })
        .where(eq(influencerProfiles.id, input.influencerId));
      return { success: true };
    }),
});
