import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import {
  barterDeals,
  barterApplications,
  brandProfiles,
  influencerProfiles,
  users,
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

// ===== BRAND ENDPOINTS =====

// POST /api/rest/barters/deals — create a new barter deal
app.post("/deals", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        productName: z.string().min(1),
        productDescription: z.string().optional(),
        productValue: z.number().optional(),
        productImage: z.string().optional(),
        contentType: z.array(z.string()).optional(),
        deliverables: z.string().optional(),
        creatorCategories: z.array(z.string()).optional(),
        minFollowers: z.number().optional(),
        maxFollowers: z.number().optional(),
        minEngagementRate: z.number().optional(),
        preferredPlatforms: z.array(z.string()).optional(),
        preferredLocation: z.string().optional(),
        campaignStart: z.string().optional(),
        campaignEnd: z.string().optional(),
        instructions: z.string().optional(),
        slotsTotal: z.number().default(1),
      })
      .parse(await c.req.json());

    const db = getDb();
    const result = await db
      .insert(barterDeals)
      .values({
        brandId: user.id,
        productName: input.productName,
        productDescription: input.productDescription,
        productValue: input.productValue?.toString(),
        productImage: input.productImage,
        contentType: input.contentType,
        deliverables: input.deliverables,
        creatorCategories: input.creatorCategories,
        minFollowers: input.minFollowers,
        maxFollowers: input.maxFollowers,
        minEngagementRate: input.minEngagementRate?.toString(),
        preferredPlatforms: input.preferredPlatforms,
        preferredLocation: input.preferredLocation,
        campaignStart: input.campaignStart ? new Date(input.campaignStart) : undefined,
        campaignEnd: input.campaignEnd ? new Date(input.campaignEnd) : undefined,
        instructions: input.instructions,
        slotsTotal: input.slotsTotal,
      })
      .returning({ insertId: barterDeals.id });

    return c.json({ success: true, dealId: Number(result[0].insertId) });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/barters/deals — list my barter deals (brand)
app.get("/deals", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.brandId, user.id))
      .orderBy(desc(barterDeals.createdAt));
    return c.json(deals);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/barters/applications — applications for my deals (brand)
app.get("/applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.brandId, user.id));

    const dealIds = deals.map((d) => d.id);
    if (dealIds.length === 0) return c.json([]);

    const applications = await db
      .select()
      .from(barterApplications)
      .where(sql`${barterApplications.dealId} IN (${sql.join(dealIds)})`)
      .orderBy(desc(barterApplications.createdAt));

    const results = [];
    for (const application of applications) {
      const [influencer] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, application.influencerId));
      const [influencerUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, application.influencerId));
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, application.dealId));
      results.push({
        ...application,
        influencer,
        user: influencerUser,
        deal,
      });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// PATCH /api/rest/barters/applications/:id/status — update application status
app.patch("/applications/:id/status", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const applicationId = z.coerce.number().parse(c.req.param("id"));
    const input = z
      .object({
        status: z.enum([
          "applied",
          "shortlisted",
          "approved",
          "content_submitted",
          "completed",
          "rejected",
        ]),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [application] = await db
      .select()
      .from(barterApplications)
      .where(eq(barterApplications.id, applicationId));
    if (!application) throw new Error("Application not found");

    const [deal] = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.id, application.dealId));
    if (!deal || deal.brandId !== user.id) throw new Error("Unauthorized");

    await db
      .update(barterApplications)
      .set({ status: input.status })
      .where(eq(barterApplications.id, applicationId));

    if (input.status === "approved") {
      await db
        .update(barterDeals)
        .set({ slotsFilled: (deal.slotsFilled ?? 0) + 1 })
        .where(eq(barterDeals.id, application.dealId));
    }

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/barters/deals/:id/close — close a barter deal
app.post("/deals/:id/close", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const dealId = z.coerce.number().parse(c.req.param("id"));
    const db = getDb();
    const [deal] = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.id, dealId));
    if (!deal || deal.brandId !== user.id) throw new Error("Unauthorized");

    await db
      .update(barterDeals)
      .set({ status: "closed" })
      .where(eq(barterDeals.id, dealId));
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// ===== INFLUENCER ENDPOINTS =====

// GET /api/rest/barters/open-deals — browse open barter deals
app.get("/open-deals", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.status, "open"))
      .orderBy(desc(barterDeals.createdAt));

    const results = [];
    for (const deal of deals) {
      const [brand] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, deal.brandId));
      results.push({ ...deal, brand });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/barters/applications — apply for a deal
app.post("/applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const input = z
      .object({
        dealId: z.number(),
        message: z.string().optional(),
        proposedDeliverables: z.string().optional(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [existing] = await db
      .select()
      .from(barterApplications)
      .where(
        and(
          eq(barterApplications.dealId, input.dealId),
          eq(barterApplications.influencerId, user.id)
        )
      );
    if (existing) throw new Error("Already applied for this deal");

    const [deal] = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.id, input.dealId));
    if (!deal || deal.status !== "open") throw new Error("Deal is not open");
    if ((deal.slotsFilled ?? 0) >= (deal.slotsTotal ?? 0))
      throw new Error("No slots remaining");

    await db.insert(barterApplications).values({
      dealId: input.dealId,
      influencerId: user.id,
      message: input.message,
      proposedDeliverables: input.proposedDeliverables,
    });
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/barters/applications/:id/content — submit content
app.post("/applications/:id/content", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const applicationId = z.coerce.number().parse(c.req.param("id"));
    const input = z
      .object({ contentLinks: z.array(z.string()) })
      .parse(await c.req.json());

    const db = getDb();
    const [application] = await db
      .select()
      .from(barterApplications)
      .where(eq(barterApplications.id, applicationId));
    if (!application || application.influencerId !== user.id)
      throw new Error("Unauthorized");
    if (application.status !== "approved")
      throw new Error("Application not approved yet");

    await db
      .update(barterApplications)
      .set({
        contentLinks: input.contentLinks,
        contentSubmittedAt: new Date(),
        status: "content_submitted",
      })
      .where(eq(barterApplications.id, applicationId));
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/barters/my-applications — my applications (influencer)
app.get("/my-applications", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const applications = await db
      .select()
      .from(barterApplications)
      .where(eq(barterApplications.influencerId, user.id))
      .orderBy(desc(barterApplications.createdAt));

    const results = [];
    for (const application of applications) {
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, application.dealId));
      const [brand] = deal
        ? await db
            .select()
            .from(brandProfiles)
            .where(eq(brandProfiles.userId, deal.brandId))
        : [null];
      results.push({ ...application, deal, brand });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// ===== PUBLIC ENDPOINTS =====

// GET /api/rest/barters/public/open-deals — list all open deals publicly
app.get("/public/open-deals", async (c) => {
  try {
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.status, "open"))
      .orderBy(desc(barterDeals.createdAt));

    const results = [];
    for (const deal of deals) {
      const [brand] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, deal.brandId));
      results.push({ ...deal, brand });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
