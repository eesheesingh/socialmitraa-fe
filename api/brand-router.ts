import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brandProfiles, users } from "@db/schema";
import { eq } from "drizzle-orm";

export const brandRouter = createRouter({
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const profile = await db.query.brandProfiles.findFirst({
      where: eq(brandProfiles.userId, ctx.user.id),
    });
    return profile ?? null;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        companyName: z.string().min(1),
        brandName: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        city: z.string().optional(),
        teamSize: z.string().optional(),
        budgetRange: z.string().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.brandProfiles.findFirst({
        where: eq(brandProfiles.userId, ctx.user.id),
      });

      if (existing) {
        await db
          .update(brandProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(brandProfiles.userId, ctx.user.id));
        return { success: true, updated: true };
      } else {
        await db.insert(brandProfiles).values({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true, updated: false };
      }
    }),

  list: publicQuery.query(async () => {
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
    return brands;
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const profile = await db.query.brandProfiles.findFirst({
        where: eq(brandProfiles.id, input.id),
      });
      return profile ?? null;
    }),
});
