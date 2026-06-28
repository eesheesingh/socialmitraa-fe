import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { influencerProfiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fetchInstagramAnalytics } from "../instagram-analytics";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

// GET /api/rest/instagrams/analytics/:username
app.get("/analytics/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const analytics = await fetchInstagramAnalytics(username);
    return c.json(analytics);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/instagrams/analyze-my-profile
app.post("/analyze-my-profile", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "influencer");
    const db = getDb();
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, user.id));

    if (!profile?.instagramId) {
      return c.json({ error: "No Instagram ID found. Please add your Instagram ID first." }, 400);
    }

    const analytics = await fetchInstagramAnalytics(profile.instagramId);
    if (!analytics) {
      return c.json({ error: "Failed to fetch analytics. Please try again later." }, 500);
    }

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
        followerCount: analytics.followers,
        engagementRate: analytics.engagementRate.toString(),
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        avgReach: analytics.estimatedReach,
      })
      .where(eq(influencerProfiles.userId, user.id));

    return c.json({ success: true, analytics });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/instagrams/my-analytics
app.get("/my-analytics", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "influencer");
    const db = getDb();
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, user.id));

    if (!profile) return c.json(null);

    return c.json({
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
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/instagrams/admin/:userId
app.get("/admin/:userId", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "admin");
    const userId = parseInt(c.req.param("userId"));
    const db = getDb();
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, userId));
    if (!profile?.instagramId) {
      return c.json({ error: "No Instagram ID" }, 404);
    }
    const analytics = await fetchInstagramAnalytics(profile.instagramId);
    return c.json(analytics);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
