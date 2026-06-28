import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { brandProfiles, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { getUser, requireAuth, handleError } from "./utils";

const app = new Hono();

// GET /api/rest/brands/me
app.get("/me", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const db = getDb();
    const profile = await db.query.brandProfiles.findFirst({
      where: eq(brandProfiles.userId, user.id),
    });
    return c.json(profile ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

// PUT /api/rest/brands/me
app.put("/me", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const input = await c.req.json();
    const db = getDb();
    const existing = await db.query.brandProfiles.findFirst({
      where: eq(brandProfiles.userId, user.id),
    });

    if (existing) {
      await db
        .update(brandProfiles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(brandProfiles.userId, user.id));
      return c.json({ success: true, updated: true });
    } else {
      await db.insert(brandProfiles).values({
        ...input,
        userId: user.id,
      });
      return c.json({ success: true, updated: false });
    }
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/brands
app.get("/", async (c) => {
  try {
    const db = getDb();
    const brands = await db
      .select({
        id: brandProfiles.id,
        companyName: brandProfiles.companyName,
        brandName: brandProfiles.brandName,
        industry: brandProfiles.industry,
        location: brandProfiles.location,
        logo: brandProfiles.logo,
        verified: brandProfiles.verified,
        userId: brandProfiles.userId,
      })
      .from(brandProfiles)
      .innerJoin(users, eq(brandProfiles.userId, users.id));
    return c.json(brands);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/brands/:id
app.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const db = getDb();
    const profile = await db.query.brandProfiles.findFirst({
      where: eq(brandProfiles.id, id),
    });
    return c.json(profile ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
