import { z } from "zod";
import { createRouter, brandQuery, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { affiliatePrograms, affiliateLinks, affiliateConversions, influencerProfiles, brandProfiles } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

function generateAffiliateCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${suffix}`;
}

export const affiliateRouter = createRouter({
  // ===== BRAND ENDPOINTS =====

  // Create an affiliate program
  createProgram: brandQuery
    .input(
      z.object({
        programName: z.string().min(1),
        description: z.string().optional(),
        commissionType: z.enum(["percentage", "fixed"]).default("percentage"),
        commissionRate: z.number().min(0).max(100), // e.g., 10 for 10%
        commissionAmount: z.number().optional(), // for fixed type
        productName: z.string().optional(),
        productValue: z.number().optional(),
        productUrl: z.string().optional(),
        cookieDuration: z.number().default(30),
        minFollowers: z.number().default(0),
        creatorCategories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(affiliatePrograms).values({
        brandId: ctx.user.id,
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
      }).returning({ insertId: affiliatePrograms.id });
      return { success: true, programId: Number(result[0].insertId) };
    }),

  // Get my affiliate programs
  myPrograms: brandQuery.query(async ({ ctx }) => {
    const db = getDb();
    const programs = await db
      .select()
      .from(affiliatePrograms)
      .where(eq(affiliatePrograms.brandId, ctx.user.id))
      .orderBy(desc(affiliatePrograms.createdAt));
    return programs;
  }),

  // Get creators who joined my program
  programCreators: brandQuery
    .input(z.object({ programId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      // Verify ownership
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, input.programId));
      if (!program || program.brandId !== ctx.user.id) throw new Error("Unauthorized");

      const links = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.programId, input.programId));

      const results = [];
      for (const link of links) {
        const [influencer] = await db
          .select()
          .from(influencerProfiles)
          .where(eq(influencerProfiles.userId, link.influencerId));
        results.push({ ...link, influencer });
      }
      return results;
    }),

  // Update program status
  updateProgram: brandQuery
    .input(
      z.object({
        programId: z.number(),
        status: z.enum(["active", "paused", "ended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, input.programId));
      if (!program || program.brandId !== ctx.user.id) throw new Error("Unauthorized");

      await db
        .update(affiliatePrograms)
        .set({ status: input.status })
        .where(eq(affiliatePrograms.id, input.programId));
      return { success: true };
    }),

  // Brand: Record a conversion (when a sale happens via affiliate link)
  recordConversion: brandQuery
    .input(
      z.object({
        linkId: z.number(),
        orderId: z.string().optional(),
        orderValue: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [link] = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.id, input.linkId));
      if (!link) throw new Error("Link not found");

      // Verify the program belongs to this brand
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, link.programId));
      if (!program || program.brandId !== ctx.user.id) throw new Error("Unauthorized");

      // Calculate commission
      let commissionAmount = 0;
      if (program.commissionType === "percentage") {
        commissionAmount = input.orderValue * (parseFloat(program.commissionRate.toString()) / 100);
      } else {
        commissionAmount = parseFloat(program.commissionAmount?.toString() ?? "0");
      }

      // Record the conversion
      await db.insert(affiliateConversions).values({
        linkId: input.linkId,
        programId: link.programId,
        orderId: input.orderId,
        orderValue: input.orderValue.toString(),
        commissionAmount: commissionAmount.toFixed(2),
      });

      // Update link totals
      await db
        .update(affiliateLinks)
        .set({
          conversions: (link.conversions ?? 0) + 1,
          commissionEarned: (parseFloat(link.commissionEarned?.toString() ?? "0") + commissionAmount).toFixed(2),
        })
        .where(eq(affiliateLinks.id, input.linkId));

      // Update program totals
      await db
        .update(affiliatePrograms)
        .set({
          totalConversions: (program.totalConversions ?? 0) + 1,
          totalCommissionPaid: (parseFloat(program.totalCommissionPaid?.toString() ?? "0") + commissionAmount).toFixed(2),
        })
        .where(eq(affiliatePrograms.id, link.programId));

      return { success: true, commissionAmount: parseFloat(commissionAmount.toFixed(2)) };
    }),

  // Brand: Approve/reject a conversion
  updateConversionStatus: brandQuery
    .input(
      z.object({
        conversionId: z.number(),
        status: z.enum(["pending", "approved", "rejected", "paid"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [conv] = await db
        .select()
        .from(affiliateConversions)
        .where(eq(affiliateConversions.id, input.conversionId));
      if (!conv) throw new Error("Conversion not found");

      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, conv.programId));
      if (!program || program.brandId !== ctx.user.id) throw new Error("Unauthorized");

      await db
        .update(affiliateConversions)
        .set({ status: input.status })
        .where(eq(affiliateConversions.id, input.conversionId));
      return { success: true };
    }),

  // ===== INFLUENCER ENDPOINTS =====

  // Browse active affiliate programs
  browsePrograms: influencerQuery.query(async () => {
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
    return results;
  }),

  // Join an affiliate program
  joinProgram: influencerQuery
    .input(
      z.object({
        programId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, input.programId));
      if (!program || program.status !== "active") throw new Error("Program not active");

      // Check if already joined
      const [existing] = await db
        .select()
        .from(affiliateLinks)
        .where(
          and(
            eq(affiliateLinks.programId, input.programId),
            eq(affiliateLinks.influencerId, ctx.user.id)
          )
        );
      if (existing) throw new Error("Already joined this program");

      // Get influencer profile for code generation
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, ctx.user.id));

      const uniqueCode = generateAffiliateCode(profile?.displayName ?? ctx.user.name ?? "CREATOR");
      const uniqueUrl = program.productUrl
        ? `${program.productUrl}?ref=${uniqueCode}`
        : `https://socialmitraa.com/ref/${uniqueCode}`;

      await db.insert(affiliateLinks).values({
        programId: input.programId,
        influencerId: ctx.user.id,
        uniqueCode,
        uniqueUrl,
      });

      // Increment creators joined
      await db
        .update(affiliatePrograms)
        .set({ totalCreatorsJoined: (program.totalCreatorsJoined ?? 0) + 1 })
        .where(eq(affiliatePrograms.id, input.programId));

      return { success: true, uniqueCode, uniqueUrl };
    }),

  // Get my affiliate links & earnings
  myLinks: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const links = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.influencerId, ctx.user.id));

    const results = [];
    for (const link of links) {
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, link.programId));
      const [brand] = program
        ? await db
            .select()
            .from(brandProfiles)
            .where(eq(brandProfiles.userId, program.brandId))
        : [null];

      // Get conversions for this link
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
    return results;
  }),

  // Record a click on affiliate link
  recordClick: publicQuery
    .input(z.object({ uniqueCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [link] = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.uniqueCode, input.uniqueCode));
      if (!link || link.status !== "active") return { error: "Invalid code" };

      await db
        .update(affiliateLinks)
        .set({ clicks: (link.clicks ?? 0) + 1 })
        .where(eq(affiliateLinks.id, link.id));

      // Update program clicks
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

      return { success: true, redirectUrl: link.uniqueUrl };
    }),

  // ===== PUBLIC =====

  // List active programs (public)
  listActivePrograms: publicQuery.query(async () => {
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
    return results;
  }),
});
