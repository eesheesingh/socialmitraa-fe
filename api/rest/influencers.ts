import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { influencerProfiles } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getUser, requireAuth, handleError } from "./utils";

const app = new Hono();

// GET /api/rest/influencers/me
app.get("/me", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const db = getDb();
    const profile = await db.query.influencerProfiles.findFirst({
      where: eq(influencerProfiles.userId, user.id),
    });
    return c.json(profile ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/influencers/me
app.put("/me", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const input = await c.req.json();
    const db = getDb();
    const existing = await db.query.influencerProfiles.findFirst({
      where: eq(influencerProfiles.userId, user.id),
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
        .where(eq(influencerProfiles.userId, user.id));
      return c.json({ success: true, updated: true });
    } else {
      await db.insert(influencerProfiles).values({
        ...data,
        userId: user.id,
      } as typeof influencerProfiles.$inferInsert);
      return c.json({ success: true, updated: false });
    }
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/influencers
app.get("/", async (c) => {
  try {
    const db = getDb();
    const query = c.req.query();

    const filters = [];

    if (query.niche) {
      filters.push(eq(influencerProfiles.niche, query.niche));
    }
    if (query.location) {
      filters.push(eq(influencerProfiles.location, query.location));
    }
    if (query.minFollowers !== undefined) {
      filters.push(gte(influencerProfiles.followerCount, parseInt(query.minFollowers)));
    }
    if (query.maxFollowers !== undefined) {
      filters.push(lte(influencerProfiles.followerCount, parseInt(query.maxFollowers)));
    }

    const limit = query.limit !== undefined ? parseInt(query.limit) : 20;
    const offset = query.offset !== undefined ? parseInt(query.offset) : 0;

    const profiles = await db
      .select()
      .from(influencerProfiles)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset);

    return c.json(profiles);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/influencers/search
app.get("/search", async (c) => {
  try {
    const db = getDb();
    const query = c.req.query();

    const filters = [];

    if (query.niche) {
      filters.push(eq(influencerProfiles.niche, query.niche));
    }
    if (query.location) {
      filters.push(eq(influencerProfiles.location, query.location));
    }
    if (query.minFollowers !== undefined) {
      filters.push(gte(influencerProfiles.followerCount, parseInt(query.minFollowers)));
    }
    if (query.maxFollowers !== undefined) {
      filters.push(lte(influencerProfiles.followerCount, parseInt(query.maxFollowers)));
    }

    const limit = query.limit !== undefined ? parseInt(query.limit) : 20;
    const offset = query.offset !== undefined ? parseInt(query.offset) : 0;

    const profiles = await db
      .select()
      .from(influencerProfiles)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset);

    return c.json(profiles);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/influencers/:id
app.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const db = getDb();
    const profile = await db.query.influencerProfiles.findFirst({
      where: eq(influencerProfiles.id, id),
    });
    return c.json(profile ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
