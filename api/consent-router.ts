import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userConsents } from "@db/schema";
import { eq } from "drizzle-orm";

export const consentRouter = createRouter({
  // Check if user has accepted T&C
  getConsent: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [consent] = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, ctx.user.id));
    return consent ?? null;
  }),

  // Accept T&C
  acceptConsent: authedQuery
    .input(
      z.object({
        termsAccepted: z.boolean(),
        privacyAccepted: z.boolean(),
        cookiesAccepted: z.boolean().optional(),
        marketingAccepted: z.boolean().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Check if consent already exists
      const [existing] = await db
        .select()
        .from(userConsents)
        .where(eq(userConsents.userId, ctx.user.id));

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
          .where(eq(userConsents.userId, ctx.user.id));
      } else {
        await db.insert(userConsents).values({
          userId: ctx.user.id,
          termsAccepted: input.termsAccepted,
          privacyAccepted: input.privacyAccepted,
          cookiesAccepted: input.cookiesAccepted ?? false,
          marketingAccepted: input.marketingAccepted ?? false,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });
      }
      return { success: true };
    }),

  // Get consent status (public, for initial load)
  checkStatus: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [consent] = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, ctx.user.id));
    return {
      hasAccepted: !!consent && consent.termsAccepted && consent.privacyAccepted,
      termsAccepted: consent?.termsAccepted ?? false,
      privacyAccepted: consent?.privacyAccepted ?? false,
    };
  }),
});
