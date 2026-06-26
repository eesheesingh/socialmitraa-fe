import { z } from "zod";
import { createRouter, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { mediaKits, influencerProfiles, users, campaignApplications } from "@db/schema";
import { eq } from "drizzle-orm";

export const mediaKitRouter = createRouter({
  // Public: Get creator's media kit by username or vanity URL
  getByUsername: publicQuery
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      // Find the influencer profile
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.instagramId, input.username.replace(/^@/, "")));

      if (!profile) {
        // Try by vanity URL
        const [kitByVanity] = await db
          .select()
          .from(mediaKits)
          .where(eq(mediaKits.vanityUrl, input.username));
        if (!kitByVanity) return null;
        const [p] = await db
          .select()
          .from(influencerProfiles)
          .where(eq(influencerProfiles.userId, kitByVanity.userId));
        if (!p) return null;
        // Return combined
        return buildPublicKit(kitByVanity, p, db);
      }

      // Get or create media kit
      const [kit] = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.userId, profile.userId));

      return buildPublicKit(kit, profile, db);
    }),

  // Influencer: Get my media kit
  myKit: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, ctx.user.id));
    if (!profile) return null;

    const [kit] = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.userId, ctx.user.id));

    // Get past collaborations
    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, ctx.user.id));

    const approvedCount = applications.filter((a) => a.status === "accepted").length;

    return {
      profile,
      kit: kit ?? null,
      stats: {
        totalApplications: applications.length,
        approvedCollaborations: approvedCount,
        totalBrandsWorkedWith: new Set(applications.map((a) => a.campaignId)).size,
        igFollowers: profile.igTotalFollowers ?? profile.followerCount ?? 0,
        igEngagement: profile.igEngagementRate ?? profile.engagementRate ?? 0,
        igAvgLikes: profile.igAvgLikes ?? profile.avgLikes ?? 0,
        igOverallScore: profile.igOverallScore ?? 0,
        igOverallRating: profile.igOverallRating ?? "—",
        igFakePercentage: profile.igFakeFollowerPercentage ?? 0,
        igQualityRating: profile.igFollowerQualityRating ?? "—",
      },
    };
  }),

  // Influencer: Update my media kit
  updateKit: influencerQuery
    .input(
      z.object({
        headline: z.string().optional(),
        about: z.string().optional(),
        achievements: z.array(z.string()).optional(),
        featuredWorks: z.array(z.object({ title: z.string(), url: z.string(), type: z.string(), brandName: z.string() })).optional(),
        testimonials: z.array(z.object({ brandName: z.string(), quote: z.string(), rating: z.number() })).optional(),
        isPublic: z.boolean().optional(),
        vanityUrl: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.userId, ctx.user.id));

      if (existing) {
        await db
          .update(mediaKits)
          .set({
            headline: input.headline ?? existing.headline,
            about: input.about ?? existing.about,
            achievements: input.achievements ?? existing.achievements,
            featuredWorks: input.featuredWorks ?? existing.featuredWorks,
            testimonials: input.testimonials ?? existing.testimonials,
            isPublic: input.isPublic ?? existing.isPublic,
            vanityUrl: input.vanityUrl ?? existing.vanityUrl,
          })
          .where(eq(mediaKits.userId, ctx.user.id));
      } else {
        await db.insert(mediaKits).values({
          userId: ctx.user.id,
          headline: input.headline,
          about: input.about,
          achievements: input.achievements,
          featuredWorks: input.featuredWorks,
          testimonials: input.testimonials,
          isPublic: input.isPublic ?? true,
          vanityUrl: input.vanityUrl,
        });
      }

      // Increment view count if viewing
      if (existing && input.vanityUrl) {
        await db
          .update(mediaKits)
          .set({ viewCount: (existing.viewCount ?? 0) + 1 })
          .where(eq(mediaKits.userId, ctx.user.id));
      }

      return { success: true };
    }),

  // Public: Increment view count
  incrementView: publicQuery
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.instagramId, input.username.replace(/^@/, "")));
      if (!profile) return;
      const [kit] = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.userId, profile.userId));
      if (kit) {
        await db
          .update(mediaKits)
          .set({ viewCount: (kit.viewCount ?? 0) + 1 })
          .where(eq(mediaKits.id, kit.id));
      }
    }),
});

// Helper: Build public media kit response
async function buildPublicKit(kit: any, profile: any, db: any) {
  // Get user info
  const [user] = await db.select().from(users).where(eq(users.id, profile.userId));

  // Get past collaborations
  const applications = await db
    .select()
    .from(campaignApplications)
    .where(eq(campaignApplications.influencerId, profile.userId));

  return {
    // Profile info
    displayName: profile.displayName ?? user?.name ?? profile.instagramId,
    fullName: profile.fullName,
    niche: profile.niche,
    bio: profile.bio,
    avatar: profile.avatar ?? user?.avatar,
    location: profile.city ?? profile.location,
    instagramId: profile.instagramId,
    isVerified: profile.igIsVerified ?? profile.verified ?? false,

    // Media kit content
    headline: kit?.headline ?? `${profile.displayName ?? "Creator"} — ${profile.niche ?? "Content Creator"}`,
    about: kit?.about ?? profile.bio,
    achievements: kit?.achievements ?? [],
    featuredWorks: kit?.featuredWorks ?? [],
    testimonials: kit?.testimonials ?? [],

    // Stats
    stats: {
      followers: profile.igTotalFollowers ?? profile.followerCount ?? 0,
      following: profile.igTotalFollowing ?? 0,
      postsCount: profile.igPostsCount ?? 0,
      engagementRate: profile.igEngagementRate ?? profile.engagementRate ?? 0,
      avgLikes: profile.igAvgLikes ?? profile.avgLikes ?? 0,
      avgComments: profile.igAvgComments ?? profile.avgComments ?? 0,
      estimatedReach: profile.igEstimatedReach ?? profile.avgReach ?? 0,
      overallScore: profile.igOverallScore ?? 0,
      overallRating: profile.igOverallRating ?? "—",
      fakeFollowerPercentage: profile.igFakeFollowerPercentage ?? 0,
      followerQualityRating: profile.igFollowerQualityRating ?? "—",
      postFrequency: profile.igPostFrequency ?? 0,
      totalCollaborations: kit?.totalCollaborations ?? applications.filter((a: any) => a.status === "accepted").length,
      contentTypes: profile.igContentTypes ?? { reel: 0, post: 0, carousel: 0 },
    },

    // Rate card
    rateCard: {
      perPost: profile.ratePerPost,
      perStory: profile.ratePerStory,
      perReel: profile.ratePerReel,
      perVideo: profile.ratePerVideo,
    },

    // Meta
    viewCount: kit?.viewCount ?? 0,
    isPublic: kit?.isPublic ?? true,
  };
}
