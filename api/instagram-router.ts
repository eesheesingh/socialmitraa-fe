import { z } from "zod";
import { createRouter, authedQuery, influencerQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { influencerProfiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { fetchInstagramAnalytics } from "./instagram-analytics";

export const instagramRouter = createRouter({
  // Fetch analytics for a username (public demo)
  fetchAnalytics: publicQuery
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const analytics = await fetchInstagramAnalytics(input.username);
      return analytics;
    }),

  // Auto-fetch and save analytics for the logged-in influencer
  analyzeMyProfile: influencerQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, ctx.user.id));

      if (!profile?.instagramId) {
        return { error: "No Instagram ID found. Please add your Instagram ID first." };
      }

      const analytics = await fetchInstagramAnalytics(profile.instagramId);
      if (!analytics) {
        return { error: "Failed to fetch analytics. Please try again later." };
      }

      // Save to database
      await db
        .update(influencerProfiles)
        .set({
          igTotalFollowers: analytics.followers,
          igTotalFollowing: analytics.following,
          igPostsCount: analytics.postsCount,
          igAvgLikes: analytics.avgLikes,
          igAvgComments: analytics.avgComments,
          igEngagementRate: analytics.engagementRate.toString(),
          igLikeEngagementRate: analytics.likeEngagementRate.toString(),
          igCommentEngagementRate: analytics.commentEngagementRate.toString(),
          igPostFrequency: analytics.postFrequency.toString(),
          igTopHashtags: analytics.topHashtags,
          igContentTypes: analytics.contentTypes,
          igFakeFollowerScore: analytics.fakeFollowerScore,
          igFakeFollowerPercentage: analytics.fakeFollowerPercentage,
          igFollowerQualityRating: analytics.followerQualityRating,
          igEstimatedReach: analytics.estimatedReach,
          igEstimatedImpressions: analytics.estimatedImpressions,
          igAudienceActivity: analytics.audienceActivity,
          igOverallScore: analytics.overallScore,
          igOverallRating: analytics.overallRating,
          igAnalyticsFetchedAt: new Date(),
          igIsVerified: analytics.isVerified,
          igIsPrivate: analytics.isPrivate,
          // Also update the main profile fields
          followerCount: analytics.followers,
          engagementRate: analytics.engagementRate.toString(),
          avgLikes: analytics.avgLikes,
          avgComments: analytics.avgComments,
          avgReach: analytics.estimatedReach,
        })
        .where(eq(influencerProfiles.userId, ctx.user.id));

      return { success: true, analytics };
    }),

  // Get my saved analytics
  myAnalytics: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, ctx.user.id));

    if (!profile) return null;

    return {
      username: profile.instagramId,
      followers: profile.igTotalFollowers,
      following: profile.igTotalFollowing,
      postsCount: profile.igPostsCount,
      avgLikes: profile.igAvgLikes,
      avgComments: profile.igAvgComments,
      engagementRate: profile.igEngagementRate,
      likeEngagementRate: profile.igLikeEngagementRate,
      commentEngagementRate: profile.igCommentEngagementRate,
      postFrequency: profile.igPostFrequency,
      topHashtags: profile.igTopHashtags,
      contentTypes: profile.igContentTypes,
      fakeFollowerScore: profile.igFakeFollowerScore,
      fakeFollowerPercentage: profile.igFakeFollowerPercentage,
      followerQualityRating: profile.igFollowerQualityRating,
      estimatedReach: profile.igEstimatedReach,
      estimatedImpressions: profile.igEstimatedImpressions,
      audienceActivity: profile.igAudienceActivity,
      overallScore: profile.igOverallScore,
      overallRating: profile.igOverallRating,
      isVerified: profile.igIsVerified,
      isPrivate: profile.igIsPrivate,
      fetchedAt: profile.igAnalyticsFetchedAt,
    };
  }),

  // Admin: fetch analytics for any user
  adminFetch: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") return { error: "Admin only" };
      const db = getDb();
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, input.userId));
      if (!profile?.instagramId) return { error: "No Instagram ID" };
      const analytics = await fetchInstagramAnalytics(profile.instagramId);
      return analytics;
    }),
});
