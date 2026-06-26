import { z } from "zod";
import { createRouter, brandQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { featuredCampaigns, campaigns, brandSubscriptions } from "@db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export const FEATURED_PRICES = {
  top_of_feed: { price: 499, label: "Featured in Feed", duration: 7 },
  urgent_badge: { price: 299, label: "Urgent Badge", duration: 7 },
  home_hero: { price: 1999, label: "Homepage Hero", duration: 7 },
  email_blast: { price: 1999, label: "Email to Creators", duration: 1 },
  push_notification: { price: 499, label: "Push Notification", duration: 1 },
};

export const featuredRouter = createRouter({
  // Brand: Feature a campaign
  featureCampaign: brandQuery
    .input(z.object({
      campaignId: z.number(),
      featureType: z.enum(["top_of_feed", "urgent_badge", "home_hero", "email_blast", "push_notification"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify brand owns the campaign
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
      if (!campaign || campaign.brandId !== ctx.user.id) throw new Error("Unauthorized");

      // Check if brand has featured campaign permission
      const [sub] = await db.select().from(brandSubscriptions).where(eq(brandSubscriptions.brandId, ctx.user.id));
      if (!sub?.canFeatureCampaigns && sub?.plan === "free") throw new Error("Upgrade to Growth plan to feature campaigns");

      const config = FEATURED_PRICES[input.featureType];
      const now = new Date();
      const expires = new Date(now);
      expires.setDate(expires.getDate() + config.duration);

      await db.insert(featuredCampaigns).values({
        campaignId: input.campaignId,
        featureType: input.featureType,
        durationDays: config.duration,
        pricePaid: config.price.toString(),
        featuredAt: now,
        expiresAt: expires,
      });

      return { success: true, price: config.price, expiresAt: expires };
    }),

  // Public: Get currently featured campaigns
  getFeatured: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const featured = await db
      .select()
      .from(featuredCampaigns)
      .where(and(eq(featuredCampaigns.status, "active"), gte(featuredCampaigns.expiresAt, now)))
      .orderBy(desc(featuredCampaigns.featuredAt))
      .limit(10);

    const results = [];
    for (const f of featured) {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, f.campaignId));
      if (campaign) results.push({ ...f, campaign });
    }
    return results;
  }),

  // Brand: My featured campaigns
  myFeatured: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, ctx.user.id));
    const campaignIds = myCampaigns.map((c) => c.id);
    if (campaignIds.length === 0) return [];

    const featured = await db
      .select()
      .from(featuredCampaigns)
      .where(sql`${featuredCampaigns.campaignId} IN (${sql.join(campaignIds)})`)
      .orderBy(desc(featuredCampaigns.featuredAt));
    return featured;
  }),
});
