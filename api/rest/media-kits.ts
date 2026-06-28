import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import { mediaKits, influencerProfiles, users, campaignApplications } from "@db/schema";
import { eq } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

// GET /api/rest/media-kits/by-username/:username
// Public: Get creator's media kit by username or vanity URL
app.get("/by-username/:username", async (c) => {
  try {
    const username = z.string().min(1).parse(c.req.param("username"));
    const db = getDb();

    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.instagramId, username.replace(/^@/, "")));

    if (!profile) {
      const [kitByVanity] = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.vanityUrl, username));
      if (!kitByVanity) return c.json(null);
      const [p] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, kitByVanity.userId));
      if (!p) return c.json(null);
      return c.json(await buildPublicKit(kitByVanity, p, db));
    }

    const [kit] = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.userId, profile.userId));

    return c.json(await buildPublicKit(kit, profile, db));
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/media-kits/me
// Influencer: Get my media kit
app.get("/me", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();

    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, user.id));
    if (!profile) return c.json(null);

    const [kit] = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.userId, user.id));

    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, user.id));

    const approvedCount = applications.filter((a) => a.status === "accepted").length;

    return c.json({
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
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/media-kits/me
// Influencer: Update my media kit
app.put("/me", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const input = updateKitSchema.parse(await c.req.json());
    const db = getDb();

    const [existing] = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.userId, user.id));

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
        .where(eq(mediaKits.userId, user.id));
    } else {
      await db.insert(mediaKits).values({
        userId: user.id,
        headline: input.headline,
        about: input.about,
        achievements: input.achievements,
        featuredWorks: input.featuredWorks,
        testimonials: input.testimonials,
        isPublic: input.isPublic ?? true,
        vanityUrl: input.vanityUrl,
      });
    }

    if (existing && input.vanityUrl) {
      await db
        .update(mediaKits)
        .set({ viewCount: (existing.viewCount ?? 0) + 1 })
        .where(eq(mediaKits.userId, user.id));
    }

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/media-kits/by-username/:username/increment-view
// Public: Increment view count
app.post("/by-username/:username/increment-view", async (c) => {
  try {
    const username = z.string().min(1).parse(c.req.param("username"));
    const db = getDb();

    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.instagramId, username.replace(/^@/, "")));
    if (!profile) return c.json(null);

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

    return c.json(null);
  } catch (error) {
    return handleError(c, error);
  }
});

const updateKitSchema = z.object({
  headline: z.string().optional(),
  about: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  featuredWorks: z
    .array(z.object({ title: z.string(), url: z.string(), type: z.string(), brandName: z.string() }))
    .optional(),
  testimonials: z.array(z.object({ brandName: z.string(), quote: z.string(), rating: z.number() })).optional(),
  isPublic: z.boolean().optional(),
  vanityUrl: z.string().max(100).optional(),
});

async function buildPublicKit(kit: any, profile: any, db: any) {
  const [user] = await db.select().from(users).where(eq(users.id, profile.userId));

  const applications = await db
    .select()
    .from(campaignApplications)
    .where(eq(campaignApplications.influencerId, profile.userId));

  return {
    displayName: profile.displayName ?? user?.name ?? profile.instagramId,
    fullName: profile.fullName,
    niche: profile.niche,
    bio: profile.bio,
    avatar: profile.avatar ?? user?.avatar,
    location: profile.city ?? profile.location,
    instagramId: profile.instagramId,
    isVerified: profile.igIsVerified ?? profile.verified ?? false,

    headline: kit?.headline ?? `${profile.displayName ?? "Creator"} — ${profile.niche ?? "Content Creator"}`,
    about: kit?.about ?? profile.bio,
    achievements: kit?.achievements ?? [],
    featuredWorks: kit?.featuredWorks ?? [],
    testimonials: kit?.testimonials ?? [],

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

    rateCard: {
      perPost: profile.ratePerPost,
      perStory: profile.ratePerStory,
      perReel: profile.ratePerReel,
      perVideo: profile.ratePerVideo,
    },

    viewCount: kit?.viewCount ?? 0,
    isPublic: kit?.isPublic ?? true,
  };
}

export default app;
