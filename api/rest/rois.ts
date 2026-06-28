import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import { campaigns, campaignApplications, campaignTracking } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

// Generate a short random code for tracking URLs
function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// POST /api/rest/rois — Brand: create tracking link for an approved application
app.post("/", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        campaignId: z.number(),
        applicationId: z.number(),
        baseUrl: z.string().optional(),
      })
      .parse(await c.req.json());

    const db = getDb();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
    if (!campaign || campaign.brandId !== user.id) throw new Error("Unauthorized");

    const [app] = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.id, input.applicationId));
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

    return c.json({ success: true, trackingUrl, shortCode });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/rois — Brand: get all tracking links for my campaigns
app.get("/", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const myCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, user.id));
    if (myCampaigns.length === 0) return c.json([]);

    const campaignIds = myCampaigns.map((c) => c.id);
    const tracking = await db
      .select()
      .from(campaignTracking)
      .where(sql`${campaignTracking.campaignId} IN (${sql.join(campaignIds)})`)
      .orderBy(desc(campaignTracking.createdAt));

    const results = [];
    for (const t of tracking) {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, t.campaignId));
      const [app] = await db
        .select()
        .from(campaignApplications)
        .where(eq(campaignApplications.id, t.applicationId));
      results.push({ ...t, campaignTitle: campaign?.title, influencerName: app?.influencerId });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/rois/click — Public: record a click
app.post("/click", async (c) => {
  try {
    const input = z.object({ shortCode: z.string() }).parse(await c.req.json());
    const db = getDb();
    const [track] = await db
      .select()
      .from(campaignTracking)
      .where(eq(campaignTracking.shortCode, input.shortCode));
    if (!track) return c.json({ error: "Invalid tracking code" });

    await db
      .update(campaignTracking)
      .set({ clicks: (track.clicks ?? 0) + 1 })
      .where(eq(campaignTracking.id, track.id));

    return c.json({ success: true, redirectUrl: track.trackingUrl });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/rois/conversions — Brand: record a conversion
app.post("/conversions", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        trackingId: z.number(),
        orderId: z.string().optional(),
        orderValue: z.number(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [track] = await db
      .select()
      .from(campaignTracking)
      .where(eq(campaignTracking.id, input.trackingId));
    if (!track) throw new Error("Tracking not found");

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, track.campaignId));
    if (!campaign || campaign.brandId !== user.id) throw new Error("Unauthorized");

    await db
      .update(campaignTracking)
      .set({
        conversions: (track.conversions ?? 0) + 1,
        revenueGenerated: (
          parseFloat(track.revenueGenerated?.toString() ?? "0") + input.orderValue
        ).toString(),
      })
      .where(eq(campaignTracking.id, input.trackingId));

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/rois/campaigns/:campaignId — Brand: get campaign analytics with ROI
app.get("/campaigns/:campaignId", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const campaignId = z.coerce.number().parse(c.req.param("campaignId"));
    const db = getDb();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaign || campaign.brandId !== user.id) throw new Error("Unauthorized");

    const tracking = await db
      .select()
      .from(campaignTracking)
      .where(eq(campaignTracking.campaignId, campaignId));

    const totalClicks = tracking.reduce((s, t) => s + (t.clicks ?? 0), 0);
    const totalConversions = tracking.reduce((s, t) => s + (t.conversions ?? 0), 0);
    const totalRevenue = tracking.reduce(
      (s, t) => s + parseFloat(t.revenueGenerated?.toString() ?? "0"),
      0
    );
    const totalSpend = parseFloat(campaign.budget?.toString() ?? "0");

    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return c.json({
      campaignId,
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
      perCreator: tracking.map((t) => ({
        trackingId: t.id,
        shortCode: t.shortCode,
        clicks: t.clicks,
        conversions: t.conversions,
        revenue: parseFloat(t.revenueGenerated?.toString() ?? "0"),
        status: t.status,
      })),
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/rois/campaigns — Brand: get all campaigns ROI overview
app.get("/campaigns", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const myCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, user.id));

    const results = [];
    for (const campaign of myCampaigns) {
      const tracking = await db
        .select()
        .from(campaignTracking)
        .where(eq(campaignTracking.campaignId, campaign.id));

      const totalClicks = tracking.reduce((s, t) => s + (t.clicks ?? 0), 0);
      const totalConversions = tracking.reduce((s, t) => s + (t.conversions ?? 0), 0);
      const totalRevenue = tracking.reduce(
        (s, t) => s + parseFloat(t.revenueGenerated?.toString() ?? "0"),
        0
      );
      const totalSpend = parseFloat(campaign.budget?.toString() ?? "0");
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

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

    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/rois/my-performance — Influencer: get my tracking performance
app.get("/my-performance", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();

    const apps = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, user.id));

    const appIds = apps.map((a) => a.id);
    if (appIds.length === 0) return c.json([]);

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
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
