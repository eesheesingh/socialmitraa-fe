import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import {
  affiliatePrograms,
  affiliateLinks,
  affiliateConversions,
  influencerProfiles,
  brandProfiles,
} from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

function generateAffiliateCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${suffix}`;
}

// ===== BRAND ENDPOINTS =====

// POST /api/rest/affiliates/programs
// Create an affiliate program
app.post("/programs", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        programName: z.string().min(1),
        description: z.string().optional(),
        commissionType: z.enum(["percentage", "fixed"]).default("percentage"),
        commissionRate: z.number().min(0).max(100),
        commissionAmount: z.number().optional(),
        productName: z.string().optional(),
        productValue: z.number().optional(),
        productUrl: z.string().optional(),
        cookieDuration: z.number().default(30),
        minFollowers: z.number().default(0),
        creatorCategories: z.array(z.string()).optional(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const result = await db
      .insert(affiliatePrograms)
      .values({
        brandId: user.id,
        programName: input.programName,
        description: input.description,
        commissionType: input.commissionType,
        commissionRate: input.commissionRate.toString(),
        commissionAmount: input.commissionAmount?.toString(),
        productName: input.productName,
        productValue: input.productValue?.toString(),
        productUrl: input.productUrl,
        cookieDuration: input.cookieDuration,
        minFollowers: input.minFollowers,
        creatorCategories: input.creatorCategories,
      })
      .returning({ insertId: affiliatePrograms.id });
    return c.json({ success: true, programId: Number(result[0].insertId) });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/affiliates/programs/owned
// Get my affiliate programs
app.get("/programs/owned", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const programs = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.brandId, user.id))
      .orderBy(desc(affiliatePrograms.createdAt));
    return c.json(programs);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/affiliates/programs/:programId/creators
// Get creators who joined my program
app.get("/programs/:programId/creators", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const programId = parseInt(c.req.param("programId"));
    const db = getDb();

    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, programId));
    if (!program || program.brandId !== user.id) throw new Error("Unauthorized");

    const links = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.programId, programId));

    const results = [];
    for (const link of links) {
      const [influencer] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, link.influencerId));
      results.push({ ...link, influencer });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/affiliates/programs/:programId/status
// Update program status
app.put("/programs/:programId/status", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const programId = parseInt(c.req.param("programId"));
    const input = z
      .object({
        status: z.enum(["active", "paused", "ended"]),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, programId));
    if (!program || program.brandId !== user.id) throw new Error("Unauthorized");

    await db
      .update(affiliatePrograms)
      .set({ status: input.status })
      .where(eq(affiliatePrograms.id, programId));
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/affiliates/conversions
// Brand: Record a conversion (when a sale happens via affiliate link)
app.post("/conversions", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        linkId: z.number(),
        orderId: z.string().optional(),
        orderValue: z.number(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.id, input.linkId));
    if (!link) throw new Error("Link not found");

    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, link.programId));
    if (!program || program.brandId !== user.id) throw new Error("Unauthorized");

    let commissionAmount = 0;
    if (program.commissionType === "percentage") {
      commissionAmount = input.orderValue * (parseFloat(program.commissionRate.toString()) / 100);
    } else {
      commissionAmount = parseFloat(program.commissionAmount?.toString() ?? "0");
    }

    await db.insert(affiliateConversions).values({
      linkId: input.linkId,
      programId: link.programId,
      orderId: input.orderId,
      orderValue: input.orderValue.toString(),
      commissionAmount: commissionAmount.toFixed(2),
    });

    await db
      .update(affiliateLinks)
      .set({
        conversions: (link.conversions ?? 0) + 1,
        commissionEarned: (parseFloat(link.commissionEarned?.toString() ?? "0") + commissionAmount).toFixed(2),
      })
      .where(eq(affiliateLinks.id, input.linkId));

    await db
      .update(affiliatePrograms)
      .set({
        totalConversions: (program.totalConversions ?? 0) + 1,
        totalCommissionPaid: (parseFloat(program.totalCommissionPaid?.toString() ?? "0") + commissionAmount).toFixed(2),
      })
      .where(eq(affiliatePrograms.id, link.programId));

    return c.json({ success: true, commissionAmount: parseFloat(commissionAmount.toFixed(2)) });
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/affiliates/conversions/:conversionId/status
// Brand: Approve/reject a conversion
app.put("/conversions/:conversionId/status", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const conversionId = parseInt(c.req.param("conversionId"));
    const input = z
      .object({
        status: z.enum(["pending", "approved", "rejected", "paid"]),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [conv] = await db
      .select()
      .from(affiliateConversions)
      .where(eq(affiliateConversions.id, conversionId));
    if (!conv) throw new Error("Conversion not found");

    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, conv.programId));
    if (!program || program.brandId !== user.id) throw new Error("Unauthorized");

    await db
      .update(affiliateConversions)
      .set({ status: input.status })
      .where(eq(affiliateConversions.id, conversionId));
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// ===== INFLUENCER ENDPOINTS =====

// GET /api/rest/affiliates/programs/browse
// Browse active affiliate programs
app.get("/programs/browse", async (c) => {
  try {
    requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const programs = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.status, "active"))
      .orderBy(desc(affiliatePrograms.createdAt));

    const results = [];
    for (const program of programs) {
      const [brand] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, program.brandId));
      results.push({ ...program, brand });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/affiliates/programs/:programId/join
// Join an affiliate program
app.post("/programs/:programId/join", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const programId = parseInt(c.req.param("programId"));
    const db = getDb();

    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, programId));
    if (!program || program.status !== "active") throw new Error("Program not active");

    const [existing] = await db
      .select()
      .from(affiliateLinks)
      .where(and(eq(affiliateLinks.programId, programId), eq(affiliateLinks.influencerId, user.id)));
    if (existing) throw new Error("Already joined this program");

    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, user.id));

    const uniqueCode = generateAffiliateCode(profile?.displayName ?? user.name ?? "CREATOR");
    const uniqueUrl = program.productUrl
      ? `${program.productUrl}?ref=${uniqueCode}`
      : `https://socialmitraa.com/ref/${uniqueCode}`;

    await db.insert(affiliateLinks).values({
      programId,
      influencerId: user.id,
      uniqueCode,
      uniqueUrl,
    });

    await db
      .update(affiliatePrograms)
      .set({ totalCreatorsJoined: (program.totalCreatorsJoined ?? 0) + 1 })
      .where(eq(affiliatePrograms.id, programId));

    return c.json({ success: true, uniqueCode, uniqueUrl });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/affiliates/links/my
// Get my affiliate links & earnings
app.get("/links/my", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const links = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.influencerId, user.id));

    const results = [];
    for (const link of links) {
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, link.programId));
      const [brand] = program
        ? await db.select().from(brandProfiles).where(eq(brandProfiles.userId, program.brandId))
        : [null];

      const conversions = await db
        .select()
        .from(affiliateConversions)
        .where(eq(affiliateConversions.linkId, link.id));

      results.push({
        ...link,
        program,
        brand,
        conversions,
        pendingCommission: conversions
          .filter((c) => c.status === "pending")
          .reduce((s, c) => s + parseFloat(c.commissionAmount?.toString() ?? "0"), 0),
        approvedCommission: conversions
          .filter((c) => c.status === "approved" || c.status === "paid")
          .reduce((s, c) => s + parseFloat(c.commissionAmount?.toString() ?? "0"), 0),
      });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// ===== PUBLIC ENDPOINTS =====

// GET /api/rest/affiliates/programs/active
// List active programs (public)
app.get("/programs/active", async (c) => {
  try {
    const db = getDb();
    const programs = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.status, "active"))
      .orderBy(desc(affiliatePrograms.createdAt));

    const results = [];
    for (const program of programs) {
      const [brand] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, program.brandId));
      results.push({ ...program, brand });
    }
    return c.json(results);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/affiliates/click
// Record a click on affiliate link
app.post("/click", async (c) => {
  try {
    const input = z.object({ uniqueCode: z.string() }).parse(await c.req.json());
    const db = getDb();
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.uniqueCode, input.uniqueCode));
    if (!link || link.status !== "active") return c.json({ error: "Invalid code" }, 400);

    await db
      .update(affiliateLinks)
      .set({ clicks: (link.clicks ?? 0) + 1 })
      .where(eq(affiliateLinks.id, link.id));

    const [program] = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.id, link.programId));
    if (program) {
      await db
        .update(affiliatePrograms)
        .set({ totalClicks: (program.totalClicks ?? 0) + 1 })
        .where(eq(affiliatePrograms.id, link.programId));
    }

    return c.json({ success: true, redirectUrl: link.uniqueUrl });
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
