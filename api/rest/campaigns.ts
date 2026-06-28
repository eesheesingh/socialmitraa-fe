import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { campaigns, campaignApplications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

// POST /api/rest/campaigns
app.post("/", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = await c.req.json();
    const db = getDb();

    const insertData: Record<string, unknown> = {
      brandId: user.id,
      title: input.title,
      description: input.description,
      requirements: input.requirements,
      platform: input.platform ?? "all",
      contentType: input.contentType ?? "all",
      niche: input.niche,
      location: input.location,
      creatorCount: input.creatorCount,
      followerMin: input.followerMin,
      followerMax: input.followerMax,
      status: "active",
    };

    if (input.budget !== undefined) {
      insertData.budget = input.budget.toString();
    }
    if (input.startDate) {
      insertData.startDate = new Date(input.startDate);
    }
    if (input.endDate) {
      insertData.endDate = new Date(input.endDate);
    }

    const result = await db
      .insert(campaigns)
      .values(insertData as typeof campaigns.$inferInsert)
      .returning({ insertId: campaigns.id });

    return c.json({ success: true, campaignId: Number(result[0].insertId) });
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/campaigns/:id
app.put("/:id", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const id = parseInt(c.req.param("id"));
    const input = await c.req.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.requirements !== undefined) updateData.requirements = input.requirements;
    if (input.platform !== undefined) updateData.platform = input.platform;
    if (input.contentType !== undefined) updateData.contentType = input.contentType;
    if (input.budget !== undefined) updateData.budget = input.budget.toString();
    if (input.creatorCount !== undefined) updateData.creatorCount = input.creatorCount;
    if (input.niche !== undefined) updateData.niche = input.niche;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.followerMin !== undefined) updateData.followerMin = input.followerMin;
    if (input.followerMax !== undefined) updateData.followerMax = input.followerMax;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
    updateData.updatedAt = new Date();

    await db
      .update(campaigns)
      .set(updateData as typeof campaigns.$inferInsert)
      .where(and(eq(campaigns.id, id), eq(campaigns.brandId, user.id)));

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/campaigns
app.get("/", async (c) => {
  try {
    const db = getDb();
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "active"))
      .orderBy(desc(campaigns.createdAt))
      .limit(50);
    return c.json(allCampaigns);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/campaigns/my-campaigns
app.get("/my-campaigns", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const myCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brandId, user.id))
      .orderBy(desc(campaigns.createdAt));
    return c.json(myCampaigns);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/campaigns/my-applications
app.get("/my-applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, user.id))
      .orderBy(desc(campaignApplications.createdAt));
    return c.json(applications);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/campaigns/:id
app.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const db = getDb();
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });
    return c.json(campaign ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/campaigns/:id/applications
app.post("/:id/applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const campaignId = parseInt(c.req.param("id"));
    const input = await c.req.json();
    const db = getDb();

    const insertData: Record<string, unknown> = {
      campaignId,
      influencerId: user.id,
      message: input.message,
    };

    if (input.proposedRate !== undefined) {
      insertData.proposedRate = input.proposedRate.toString();
    }

    await db
      .insert(campaignApplications)
      .values(insertData as typeof campaignApplications.$inferInsert);

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/campaigns/:id/applications
app.get("/:id/applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const campaignId = parseInt(c.req.param("id"));
    const db = getDb();

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });
    if (!campaign || campaign.brandId !== user.id) {
      return c.json([]);
    }

    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.campaignId, campaignId))
      .orderBy(desc(campaignApplications.createdAt));
    return c.json(applications);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
