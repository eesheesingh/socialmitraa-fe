import { z } from "zod";
import { nanoid } from "nanoid";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./lib/password";
import { signSessionToken } from "./kimi/session";
import { env } from "./lib/env";
import type { TrpcContext } from "./context";

function setSessionCookie(ctx: TrpcContext, token: string) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => {
    // Never expose the password hash to the client
    const { passwordHash, ...safe } = opts.ctx.user;
    return safe;
  }),

  register: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(320),
        password: z.string().min(8).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase();
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }
      const passwordHash = await hashPassword(input.password);
      const unionId = `local:${nanoid()}`;
      await db.insert(users).values({
        unionId,
        name: input.name,
        email,
        passwordHash,
      });
      const token = await signSessionToken({ unionId, clientId: env.appId });
      setSessionCookie(ctx, token);
      return { success: true };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase();
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = rows.at(0);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }
      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));
      const token = await signSessionToken({
        unionId: user.unionId,
        clientId: env.appId,
      });
      setSessionCookie(ctx, token);
      return { success: true };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  updateRole: authedQuery
    .input(
      z.object({
        role: z.enum(["user", "brand", "influencer", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, ctx.user.id));
      return { success: true, role: input.role };
    }),

  completeOnboarding: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(users)
      .set({ onboardingComplete: true })
      .where(eq(users.id, ctx.user.id));
    return { success: true };
  }),

  getProfile: publicQuery.query(async () => {
    return null;
  }),
});
