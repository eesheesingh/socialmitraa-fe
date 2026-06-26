import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaigns, campaignApplications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const campaignRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        requirements: z.string().optional(),
        platform: z.enum(["instagram", "youtube", "tiktok", "all"]).optional(),
        contentType: z.enum(["post", "story", "reel", "all"]).optional(),
        budget: z.number().optional(),
        creatorCount: z.number().optional(),
        niche: z.string().optional(),
        location: z.string().optional(),
        followerMin: z.number().optional(),
        followerMax: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const insertData: Record<string, unknown> = {
        brandId: ctx.user.id,
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
      const result = await db.insert(campaigns).values(insertData as typeof campaigns.$inferInsert).returning({ insertId: campaigns.id });
      return { success: true, campaignId: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        platform: z.enum(["instagram", "youtube", "tiktok", "all"]).optional(),
        contentType: z.enum(["post", "story", "reel", "all"]).optional(),
        budget: z.number().optional(),
        creatorCount: z.number().optional(),
        niche: z.string().optional(),
        location: z.string().optional(),
        followerMin: z.number().optional(),
        followerMax: z.number().optional(),
        status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.requirements !== undefined) updateData.requirements = data.requirements;
      if (data.platform !== undefined) updateData.platform = data.platform;
      if (data.contentType !== undefined) updateData.contentType = data.contentType;
      if (data.budget !== undefined) updateData.budget = data.budget.toString();
      if (data.creatorCount !== undefined) updateData.creatorCount = data.creatorCount;
      if (data.niche !== undefined) updateData.niche = data.niche;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.followerMin !== undefined) updateData.followerMin = data.followerMin;
      if (data.followerMax !== undefined) updateData.followerMax = data.followerMax;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      updateData.updatedAt = new Date();

      await db
        .update(campaigns)
        .set(updateData as typeof campaigns.$inferInsert)
        .where(and(eq(campaigns.id, id), eq(campaigns.brandId, ctx.user.id)));
      return { success: true };
    }),

  list: publicQuery.query(async () => {
    const db = getDb();
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "active"))
      .orderBy(desc(campaigns.createdAt))
      .limit(50);
    return allCampaigns;
  }),

  myCampaigns: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brandId, ctx.user.id))
      .orderBy(desc(campaigns.createdAt));
    return myCampaigns;
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, input.id),
      });
      return campaign ?? null;
    }),

  submitApplication: authedQuery
    .input(
      z.object({
        campaignId: z.number(),
        message: z.string().optional(),
        proposedRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const insertData: Record<string, unknown> = {
        campaignId: input.campaignId,
        influencerId: ctx.user.id,
        message: input.message,
      };
      if (input.proposedRate !== undefined) {
        insertData.proposedRate = input.proposedRate.toString();
      }
      await db.insert(campaignApplications).values(insertData as typeof campaignApplications.$inferInsert);
      return { success: true };
    }),

  myApplications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, ctx.user.id))
      .orderBy(desc(campaignApplications.createdAt));
    return applications;
  }),

  getApplications: authedQuery
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, input.campaignId),
      });
      if (!campaign || campaign.brandId !== ctx.user.id) {
        return [];
      }
      const applications = await db
        .select()
        .from(campaignApplications)
        .where(eq(campaignApplications.campaignId, input.campaignId))
        .orderBy(desc(campaignApplications.createdAt));
      return applications;
    }),
});
