import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import {
  payments,
  notifications,
  brandSubscriptions,
  creatorSubscriptions,
} from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

const GST_RATE = 18;

interface PaymentCalculation {
  subtotal: number;
  gstAmount: number;
  total: number;
}

function calculateWithGst(amount: number): PaymentCalculation {
  const subtotal = Math.round(amount * 100) / 100;
  const gstAmount = Math.round(subtotal * GST_RATE) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { subtotal, gstAmount, total };
}

// POST /api/rest/payments — create payment in escrow
app.post("/", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const input = z
      .object({
        campaignId: z.number().optional(),
        influencerId: z.number(),
        amount: z.number().min(1),
        description: z.string().optional(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const calc = calculateWithGst(input.amount);

    const result = await db
      .insert(payments)
      .values({
        brandId: user.id,
        campaignId: input.campaignId,
        influencerId: input.influencerId,
        amount: calc.total.toString(),
        subtotal: calc.subtotal.toString(),
        gstAmount: calc.gstAmount.toString(),
        gstRate: GST_RATE.toString(),
        currency: "INR",
        gateway: "razorpay",
        status: "escrow",
        gatewayStatus: "pending",
        description: input.description,
      })
      .returning({ insertId: payments.id });

    await db.insert(notifications).values({
      userId: input.influencerId,
      type: "payout_released",
      title: "New Payment in Escrow",
      message: `A payment of Rs.${calc.total.toLocaleString()} (incl. 18% GST) has been placed in escrow for you.`,
      metadata: {
        paymentId: Number(result[0].insertId),
        amount: calc.total,
        gst: calc.gstAmount,
      },
    });

    return c.json({
      success: true,
      paymentId: Number(result[0].insertId),
      subtotal: calc.subtotal,
      gstAmount: calc.gstAmount,
      total: calc.total,
      gstRate: GST_RATE,
      disclaimer: `18% GST (Rs.${calc.gstAmount.toLocaleString()}) has been added. Total: Rs.${calc.total.toLocaleString()}`,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/payments/calculate-gst?amount=...
app.get("/calculate-gst", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const rawAmount = c.req.query("amount");
    if (!rawAmount) {
      return c.json({ error: "Missing amount query parameter" }, 400);
    }
    const amount = z.coerce.number().min(1).parse(rawAmount);
    const calc = calculateWithGst(amount);
    return c.json({
      ...calc,
      gstRate: GST_RATE,
      disclaimer: `All prices are exclusive of 18% GST. GST of Rs.${calc.gstAmount.toLocaleString()} will be added at checkout. Final amount: Rs.${calc.total.toLocaleString()}`,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/payments/my-payments
app.get("/my-payments", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const db = getDb();
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.brandId, user.id))
      .orderBy(desc(payments.createdAt));
    return c.json(rows);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/payments/my-earnings
app.get("/my-earnings", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "influencer");
    const db = getDb();
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.influencerId, user.id))
      .orderBy(desc(payments.createdAt));
    return c.json(rows);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/payments/:id/release
app.post("/:id/release", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const paymentId = z.coerce.number().parse(c.req.param("id"));
    const db = getDb();
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    if (!payment || payment.brandId !== user.id) {
      throw new Error("Payment not found");
    }
    await db
      .update(payments)
      .set({
        status: "released",
        gatewayStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    await db.insert(notifications).values({
      userId: payment.influencerId,
      type: "payout_released",
      title: "Payment Released!",
      message: `Your payment of Rs.${payment.amount} has been released from escrow.`,
    });

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/payments/:id/refund
app.post("/:id/refund", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "brand");
    const paymentId = z.coerce.number().parse(c.req.param("id"));
    const db = getDb();
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    if (!payment || payment.brandId !== user.id) {
      throw new Error("Payment not found");
    }
    await db
      .update(payments)
      .set({
        status: "refunded",
        gatewayStatus: "refunded",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/payments/subscription-payment
app.post("/subscription-payment", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const input = z
      .object({
        userType: z.enum(["brand", "creator"]),
        plan: z.string(),
        amount: z.number(),
      })
      .parse(await c.req.json());

    const db = getDb();
    const calc = calculateWithGst(input.amount);
    const table = input.userType === "brand" ? brandSubscriptions : creatorSubscriptions;
    const idField =
      input.userType === "brand"
        ? brandSubscriptions.brandId
        : creatorSubscriptions.creatorId;

    await db
      .update(table)
      .set({
        plan: input.plan as any,
        status: "active",
        monthlyPrice: calc.total.toString(),
        lastPaymentDate: new Date(),
        lastPaymentStatus: "success",
        failedPaymentCount: 0,
        gracePeriodEndsAt: null,
        downgradeScheduledAt: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSubscriptionPaid: sql`${table.totalSubscriptionPaid} + ${calc.total.toString()}`,
      })
      .where(eq(idField as any, user.id));

    return c.json({ success: true, amount: calc.total, gst: calc.gstAmount });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/payments/subscription-failure
app.post("/subscription-failure", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const input = z
      .object({ userType: z.enum(["brand", "creator"]) })
      .parse(await c.req.json());

    const db = getDb();
    const table = input.userType === "brand" ? brandSubscriptions : creatorSubscriptions;
    const idField =
      input.userType === "brand"
        ? brandSubscriptions.brandId
        : creatorSubscriptions.creatorId;

    const [sub] = await db
      .select()
      .from(table)
      .where(eq(idField as any, user.id));
    if (!sub) return c.json({ error: "No subscription found" });

    const newFailCount = (sub.failedPaymentCount ?? 0) + 1;

    if (newFailCount >= 3) {
      await db
        .update(table)
        .set({
          plan: "free",
          status: "expired",
          lastPaymentStatus: "failed",
          failedPaymentCount: newFailCount,
          downgradeScheduledAt: new Date(),
        })
        .where(eq(idField as any, user.id));

      await db.insert(notifications).values({
        userId: user.id,
        type: "subscription_downgraded",
        title: "Subscription Downgraded",
        message:
          "Your subscription has been downgraded to Free due to 3 failed payment attempts. Please update your payment method to continue enjoying premium features.",
        actionUrl: "/pricing",
      });

      return c.json({ downgraded: true, message: "Downgraded to free plan" });
    }

    const graceEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db
      .update(table)
      .set({
        lastPaymentStatus: "failed",
        failedPaymentCount: newFailCount,
        gracePeriodEndsAt: graceEnds,
        reminderSentAt: new Date(),
      })
      .where(eq(idField as any, user.id));

    await db.insert(notifications).values({
      userId: user.id,
      type: "payment_failed",
      title: `Payment Failed (Attempt ${newFailCount}/3)`,
      message:
        "Your subscription payment could not be processed. You have a 7-day grace period. Please update your payment method to avoid downgrade.",
      actionUrl: "/pricing",
    });

    return c.json({
      gracePeriod: true,
      graceEnds,
      attemptsLeft: 3 - newFailCount,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/payments — admin list all payments
app.get("/", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "admin");
    const db = getDb();
    const rows = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
    return c.json(rows);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/payments/analytics — admin analytics
app.get("/analytics", async (c) => {
  try {
    const user = requireRole(requireAuth(await getUser(c.req.raw)), "admin");
    const db = getDb();
    const [totalRev] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments);
    const [gstCollected] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.gstAmount}), 0)` })
      .from(payments);
    const [escrowTotal] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "escrow"));
    const [releasedTotal] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "released"));
    const [refundedTotal] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "refunded"));
    const totalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments);

    return c.json({
      totalRevenue: totalRev?.total ?? 0,
      gstCollected: gstCollected?.total ?? 0,
      inEscrow: escrowTotal?.total ?? 0,
      released: releasedTotal?.total ?? 0,
      refunded: refundedTotal?.total ?? 0,
      totalTransactions: totalCount[0]?.count ?? 0,
      gstRate: GST_RATE,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

export default app;
