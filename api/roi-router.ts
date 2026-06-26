import { z } from "zod";
import { createRouter, brandQuery, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaignTracking, campaigns, campaignApplications } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

// Generate a short random code for tracking URLs
function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export const roiRouter = createRouter({
  // Brand: Create tracking link for an approved application
  createTracking: brandQuery
    .input(
      z.object({
        campaignId: z.number(),
        applicationId: z.number(),
        baseUrl: z.string().optional(), // e.g., "https://brand.com/sale"
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify the campaign belongs to this brand
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
      if (!campaign || campaign.brandId !== ctx.user.id) throw new Error("Unauthorized");

      // Verify the application
      const [app] = await db.select().from(campaignApplications).where(eq(campaignApplications.id, input.applicationId));
      if (!app || app.campaignId !== input.campaignId) throw new Error("Application not found");

      const shortCode = generateShortCode();
      const baseUrl = input.baseUrl ?? "https://socialmitraa.com/track";
      const trackingUrl = `${baseUrl}/${shortCode}`;

      await db.insert(campaignTracking).values({
        campaignId: input.campaignId,
        applicationId: input.applicationId,
        trackingUrl,
        shortCode,
      });

      return { success: true, trackingUrl, shortCode };
    }),

  // Brand: Get all tracking links for my campaigns
  myTracking: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, ctx.user.id));
    if (myCampaigns.length === 0) return [];

    const campaignIds = myCampaigns.map((c) => c.id);
    const tracking = await db
      .select()
      .from(campaignTracking)
      .where(sql`${campaignTracking.campaignId} IN (${sql.join(campaignIds)})`)
      .orderBy(desc(campaignTracking.createdAt));

    // Get campaign and influencer info for each
    const results = [];
    for (const t of tracking) {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, t.campaignId));
      const [app] = await db.select().from(campaignApplications).where(eq(campaignApplications.id, t.applicationId));
      results.push({ ...t, campaignTitle: campaign?.title, influencerName: app?.influencerId });
    }
    return results;
  }),

  // Brand: Record a click (called when someone visits tracking URL)
  recordClick: publicQuery
    .input(z.object({ shortCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [track] = await db
        .select()
        .from(campaignTracking)
        .where(eq(campaignTracking.shortCode, input.shortCode));
      if (!track) return { error: "Invalid tracking code" };

      await db
        .update(campaignTracking)
        .set({ clicks: (track.clicks ?? 0) + 1 })
        .where(eq(campaignTracking.id, track.id));

      return { success: true, redirectUrl: track.trackingUrl };
    }),

  // Brand: Record conversion (brand reports a sale)
  recordConversion: brandQuery
    .input(
      z.object({
        trackingId: z.number(),
        orderId: z.string().optional(),
        orderValue: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [track] = await db.select().from(campaignTracking).where(eq(campaignTracking.id, input.trackingId));
      if (!track) throw new Error("Tracking not found");

      // Verify campaign belongs to brand
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, track.campaignId));
      if (!campaign || campaign.brandId !== ctx.user.id) throw new Error("Unauthorized");

      await db
        .update(campaignTracking)
        .set({
          conversions: (track.conversions ?? 0) + 1,
          revenueGenerated: (parseFloat(track.revenueGenerated?.toString() ?? "0") + input.orderValue).toString(),
        })
        .where(eq(campaignTracking.id, input.trackingId));

      return { success: true };
    }),

  // Brand: Get campaign analytics with ROI
  campaignRoi: brandQuery
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
      if (!campaign || campaign.brandId !== ctx.user.id) throw new Error("Unauthorized");

      // Get all tracking for this campaign
      const tracking = await db
        .select()
        .from(campaignTracking)
        .where(eq(campaignTracking.campaignId, input.campaignId));

      // Calculate aggregated metrics
      const totalClicks = tracking.reduce((s, t) => s + (t.clicks ?? 0), 0);
      const totalConversions = tracking.reduce((s, t) => s + (t.conversions ?? 0), 0);
      const totalRevenue = tracking.reduce((s, t) => s + parseFloat(t.revenueGenerated?.toString() ?? "0"), 0);
      const totalSpend = parseFloat(campaign.budget?.toString() ?? "0");

      // Calculate ROI: (Revenue - Spend) / Spend × 100
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;

      return {
        campaignId: input.campaignId,
        campaignTitle: campaign.title,
        totalSpend,
        totalRevenue,
        totalClicks,
        totalConversions,
        roi: parseFloat(roi.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        trackingLinks: tracking.length,
        period: {
          start: campaign.createdAt,
          end: campaign.endDate ?? new Date(),
        },
        // Per-creator breakdown
        perCreator: tracking.map((t) => ({
          trackingId: t.id,
          shortCode: t.shortCode,
          clicks: t.clicks,
          conversions: t.conversions,
          revenue: parseFloat(t.revenueGenerated?.toString() ?? "0"),
          status: t.status,
        })),
      };
    }),

  // Brand: Get all campaigns ROI overview
  allCampaignsRoi: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, ctx.user.id));

    const results = [];
    for (const campaign of myCampaigns) {
      const tracking = await db
        .select()
        .from(campaignTracking)
        .where(eq(campaignTracking.campaignId, campaign.id));

      const totalClicks = tracking.reduce((s, t) => s + (t.clicks ?? 0), 0);
      const totalConversions = tracking.reduce((s, t) => s + (t.conversions ?? 0), 0);
      const totalRevenue = tracking.reduce((s, t) => s + parseFloat(t.revenueGenerated?.toString() ?? "0"), 0);
      const totalSpend = parseFloat(campaign.budget?.toString() ?? "0");
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;

      results.push({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        status: campaign.status,
        totalSpend,
        totalRevenue,
        totalClicks,
        totalConversions,
        roi: parseFloat(roi.toFixed(2)),
        trackingLinks: tracking.length,
        createdAt: campaign.createdAt,
      });
    }

    return results;
  }),

  // Influencer: Get my tracking performance
  myPerformance: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    // Get all my applications
    const apps = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, ctx.user.id));

    const appIds = apps.map((a) => a.id);
    if (appIds.length === 0) return [];

    const tracking = await db
      .select()
      .from(campaignTracking)
      .where(sql`${campaignTracking.applicationId} IN (${sql.join(appIds)})`);

    const results = [];
    for (const t of tracking) {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, t.campaignId));
      results.push({
        ...t,
        campaignTitle: campaign?.title ?? "Unknown",
      });
    }
    return results;
  }),
});
