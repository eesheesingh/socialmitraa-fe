import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import { userConsents } from "@db/schema";
import { eq } from "drizzle-orm";
import { getUser, requireAuth, handleError } from "./utils";

const app = new Hono();

// GET /api/rest/consents/me
app.get("/me", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const db = getDb();
    const [consent] = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, user.id));
    return c.json(consent ?? null);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/consents/accept
app.post("/accept", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const input = z
      .object({
        termsAccepted: z.boolean(),
        privacyAccepted: z.boolean(),
        cookiesAccepted: z.boolean().optional(),
        marketingAccepted: z.boolean().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const [existing] = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, user.id));

    if (existing) {
      await db
        .update(userConsents)
        .set({
          termsAccepted: input.termsAccepted,
          privacyAccepted: input.privacyAccepted,
          cookiesAccepted: input.cookiesAccepted ?? existing.cookiesAccepted,
          marketingAccepted: input.marketingAccepted ?? existing.marketingAccepted,
          ipAddress: input.ipAddress ?? existing.ipAddress,
          userAgent: input.userAgent ?? existing.userAgent,
        })
        .where(eq(userConsents.userId, user.id));
    } else {
      await db.insert(userConsents).values({
        userId: user.id,
        termsAccepted: input.termsAccepted,
        privacyAccepted: input.privacyAccepted,
        cookiesAccepted: input.cookiesAccepted ?? false,
        marketingAccepted: input.marketingAccepted ?? false,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    }

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/consents/status
app.get("/status", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const db = getDb();
    const [consent] = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, user.id));

    return c.json({
      hasAccepted: !!consent && consent.termsAccepted && consent.privacyAccepted,
      termsAccepted: consent?.termsAccepted ?? false,
      privacyAccepted: consent?.privacyAccepted ?? false,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
