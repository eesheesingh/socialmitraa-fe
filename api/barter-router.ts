import { z } from "zod";
import { createRouter, brandQuery, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { barterDeals, barterApplications, brandProfiles, influencerProfiles, users } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const barterRouter = createRouter({
  // ===== BRAND ENDPOINTS =====

  // Create a new barter deal
  createDeal: brandQuery
    .input(
      z.object({
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
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(barterDeals).values({
        brandId: ctx.user.id,
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
      }).returning({ insertId: barterDeals.id });
      return { success: true, dealId: Number(result[0].insertId) };
    }),

  // Get my barter deals (brand)
  myDeals: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.brandId, ctx.user.id))
      .orderBy(desc(barterDeals.createdAt));
    return deals;
  }),

  // Get applications for my deals (brand)
  myDealApplications: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.brandId, ctx.user.id));

    const dealIds = deals.map((d) => d.id);
    if (dealIds.length === 0) return [];

    const applications = await db
      .select()
      .from(barterApplications)
      .where(sql`${barterApplications.dealId} IN (${sql.join(dealIds)})`)
      .orderBy(desc(barterApplications.createdAt));

    // Get influencer details for each application
    const results = [];
    for (const app of applications) {
      const [influencer] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, app.influencerId));
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, app.influencerId));
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, app.dealId));
      results.push({ ...app, influencer, user, deal });
    }
    return results;
  }),

  // Update application status (brand)
  updateApplicationStatus: brandQuery
    .input(
      z.object({
        applicationId: z.number(),
        status: z.enum(["applied", "shortlisted", "approved", "content_submitted", "completed", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify the application belongs to one of the brand's deals
      const [app] = await db
        .select()
        .from(barterApplications)
        .where(eq(barterApplications.id, input.applicationId));
      if (!app) throw new Error("Application not found");

      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, app.dealId));
      if (!deal || deal.brandId !== ctx.user.id) throw new Error("Unauthorized");

      await db
        .update(barterApplications)
        .set({ status: input.status })
        .where(eq(barterApplications.id, input.applicationId));

      // If approved, increment slots filled
      if (input.status === "approved") {
        await db
          .update(barterDeals)
          .set({ slotsFilled: (deal.slotsFilled ?? 0) + 1 })
          .where(eq(barterDeals.id, app.dealId));
      }

      return { success: true };
    }),

  // Close a barter deal
  closeDeal: brandQuery
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, input.dealId));
      if (!deal || deal.brandId !== ctx.user.id) throw new Error("Unauthorized");

      await db
        .update(barterDeals)
        .set({ status: "closed" })
        .where(eq(barterDeals.id, input.dealId));
      return { success: true };
    }),

  // ===== INFLUENCER ENDPOINTS =====

  // Browse open barter deals
  browseDeals: influencerQuery.query(async () => {
    const db = getDb();
    const deals = await db
      .select()
      .from(barterDeals)
      .where(eq(barterDeals.status, "open"))
      .orderBy(desc(barterDeals.createdAt));

    // Get brand info for each deal
    const results = [];
    for (const deal of deals) {
      const [brand] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, deal.brandId));
      results.push({ ...deal, brand });
    }
    return results;
  }),

  // Apply for a barter deal
  submitApplication: influencerQuery
    .input(
      z.object({
        dealId: z.number(),
        message: z.string().optional(),
        proposedDeliverables: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Check if already applied
      const [existing] = await db
        .select()
        .from(barterApplications)
        .where(
          and(
            eq(barterApplications.dealId, input.dealId),
            eq(barterApplications.influencerId, ctx.user.id)
          )
        );
      if (existing) throw new Error("Already applied for this deal");

      // Check if deal is still open and has slots
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, input.dealId));
      if (!deal || deal.status !== "open") throw new Error("Deal is not open");
      if ((deal.slotsFilled ?? 0) >= (deal.slotsTotal ?? 0)) throw new Error("No slots remaining");

      await db.insert(barterApplications).values({
        dealId: input.dealId,
        influencerId: ctx.user.id,
        message: input.message,
        proposedDeliverables: input.proposedDeliverables,
      });
      return { success: true };
    }),

  // Submit content for an approved barter
  submitContent: influencerQuery
    .input(
      z.object({
        applicationId: z.number(),
        contentLinks: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [app] = await db
        .select()
        .from(barterApplications)
        .where(eq(barterApplications.id, input.applicationId));
      if (!app || app.influencerId !== ctx.user.id) throw new Error("Unauthorized");
      if (app.status !== "approved") throw new Error("Application not approved yet");

      await db
        .update(barterApplications)
        .set({
          contentLinks: input.contentLinks,
          contentSubmittedAt: new Date(),
          status: "content_submitted",
        })
        .where(eq(barterApplications.id, input.applicationId));
      return { success: true };
    }),

  // Get my barter applications (influencer)
  myApplications: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const applications = await db
      .select()
      .from(barterApplications)
      .where(eq(barterApplications.influencerId, ctx.user.id))
      .orderBy(desc(barterApplications.createdAt));

    const results = [];
    for (const app of applications) {
      const [deal] = await db
        .select()
        .from(barterDeals)
        .where(eq(barterDeals.id, app.dealId));
      const [brand] = deal
        ? await db
            .select()
            .from(brandProfiles)
            .where(eq(brandProfiles.userId, deal.brandId))
        : [null];
      results.push({ ...app, deal, brand });
    }
    return results;
  }),

  // ===== PUBLIC ENDPOINTS =====

  // Get all open barter deals (public)
  listOpenDeals: publicQuery.query(async () => {
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
    return results;
  }),
});
