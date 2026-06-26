import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { influencerProfiles } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const influencerRouter = createRouter({
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const profile = await db.query.influencerProfiles.findFirst({
      where: eq(influencerProfiles.userId, ctx.user.id),
    });
    return profile ?? null;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        fullName: z.string().min(1),
        displayName: z.string().min(1),
        bio: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        instagramId: z.string().optional(),
        facebookId: z.string().optional(),
        youtubeId: z.string().optional(),
        tiktokId: z.string().optional(),
        twitterId: z.string().optional(),
        linkedinId: z.string().optional(),
        categories: z.array(z.string()).optional(),
        niche: z.string().optional(),
        location: z.string().optional(),
        city: z.string().optional(),
        followerCount: z.number().optional(),
        engagementRate: z.number().optional(),
        avgLikes: z.number().optional(),
        avgComments: z.number().optional(),
        avgReach: z.number().optional(),
        platforms: z.array(z.string()).optional(),
        ratePerPost: z.number().optional(),
        ratePerStory: z.number().optional(),
        ratePerReel: z.number().optional(),
        ratePerVideo: z.number().optional(),
        portfolioLinks: z.array(z.string()).optional(),
        sampleWork: z.string().optional(),
        avatar: z.string().optional(),
        availableForCollaboration: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.influencerProfiles.findFirst({
        where: eq(influencerProfiles.userId, ctx.user.id),
      });

      const data: Record<string, unknown> = {
        fullName: input.fullName,
        displayName: input.displayName,
        bio: input.bio,
        email: input.email,
        phone: input.phone,
        instagramId: input.instagramId,
        facebookId: input.facebookId,
        youtubeId: input.youtubeId,
        tiktokId: input.tiktokId,
        twitterId: input.twitterId,
        linkedinId: input.linkedinId,
        categories: input.categories,
        niche: input.niche,
        location: input.location,
        city: input.city,
        followerCount: input.followerCount,
        avgLikes: input.avgLikes,
        avgComments: input.avgComments,
        avgReach: input.avgReach,
        platforms: input.platforms,
        portfolioLinks: input.portfolioLinks,
        sampleWork: input.sampleWork,
        avatar: input.avatar,
        availableForCollaboration: input.availableForCollaboration,
      };

      if (input.engagementRate !== undefined) {
        data.engagementRate = input.engagementRate.toString();
      }
      if (input.ratePerPost !== undefined) {
        data.ratePerPost = input.ratePerPost.toString();
      }
      if (input.ratePerStory !== undefined) {
        data.ratePerStory = input.ratePerStory.toString();
      }
      if (input.ratePerReel !== undefined) {
        data.ratePerReel = input.ratePerReel.toString();
      }
      if (input.ratePerVideo !== undefined) {
        data.ratePerVideo = input.ratePerVideo.toString();
      }

      if (existing) {
        await db
          .update(influencerProfiles)
          .set({ ...data, updatedAt: new Date() } as typeof influencerProfiles.$inferInsert)
          .where(eq(influencerProfiles.userId, ctx.user.id));
        return { success: true, updated: true };
      } else {
        await db.insert(influencerProfiles).values({
          ...data,
          userId: ctx.user.id,
        } as typeof influencerProfiles.$inferInsert);
        return { success: true, updated: false };
      }
    }),

  list: publicQuery
    .input(
      z
        .object({
          niche: z.string().optional(),
          location: z.string().optional(),
          minFollowers: z.number().optional(),
          maxFollowers: z.number().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.niche) {
        filters.push(eq(influencerProfiles.niche, input.niche));
      }
      if (input?.location) {
        filters.push(eq(influencerProfiles.location, input.location));
      }
      if (input?.minFollowers !== undefined) {
        filters.push(gte(influencerProfiles.followerCount, input.minFollowers));
      }
      if (input?.maxFollowers !== undefined) {
        filters.push(lte(influencerProfiles.followerCount, input.maxFollowers));
      }

      const profiles = await db
        .select()
        .from(influencerProfiles)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      return profiles;
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const profile = await db.query.influencerProfiles.findFirst({
        where: eq(influencerProfiles.id, input.id),
      });
      return profile ?? null;
    }),

  search: publicQuery
    .input(
      z.object({
        query: z.string().optional(),
        niche: z.string().optional(),
        location: z.string().optional(),
        minFollowers: z.number().optional(),
        maxFollowers: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input.niche) {
        filters.push(eq(influencerProfiles.niche, input.niche));
      }
      if (input.location) {
        filters.push(eq(influencerProfiles.location, input.location));
      }
      if (input.minFollowers !== undefined) {
        filters.push(gte(influencerProfiles.followerCount, input.minFollowers));
      }
      if (input.maxFollowers !== undefined) {
        filters.push(lte(influencerProfiles.followerCount, input.maxFollowers));
      }

      const profiles = await db
        .select()
        .from(influencerProfiles)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .limit(input.limit)
        .offset(input.offset);

      return profiles;
    }),
});
