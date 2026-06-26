import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, notifications, brandSubscriptions, creatorSubscriptions } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

const GST_RATE = 18; // 18% GST

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

export const paymentRouter = createRouter({
  // Create a payment (escrow) — with 18% GST
  create: authedQuery
    .input(
      z.object({
        campaignId: z.number().optional(),
        influencerId: z.number(),
        amount: z.number().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const calc = calculateWithGst(input.amount);

      const result = await db.insert(payments).values({
        brandId: ctx.user.id,
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
      }).returning({ insertId: payments.id });

      // Create notification for influencer
      await db.insert(notifications).values({
        userId: input.influencerId,
        type: "payout_released",
        title: "New Payment in Escrow",
        message: `A payment of Rs.${calc.total.toLocaleString()} (incl. 18% GST) has been placed in escrow for you.`,
        metadata: { paymentId: Number(result[0].insertId), amount: calc.total, gst: calc.gstAmount },
      });

      return {
        success: true,
        paymentId: Number(result[0].insertId),
        subtotal: calc.subtotal,
        gstAmount: calc.gstAmount,
        total: calc.total,
        gstRate: GST_RATE,
        disclaimer: `18% GST (Rs.${calc.gstAmount.toLocaleString()}) has been added. Total: Rs.${calc.total.toLocaleString()}`,
      };
    }),

  // Get GST calculation preview (before creating payment)
  calculateGst: authedQuery
    .input(z.object({ amount: z.number().min(1) }))
    .query(async ({ input }) => {
      const calc = calculateWithGst(input.amount);
      return {
        ...calc,
        gstRate: GST_RATE,
        disclaimer: `All prices are exclusive of 18% GST. GST of Rs.${calc.gstAmount.toLocaleString()} will be added at checkout. Final amount: Rs.${calc.total.toLocaleString()}`,
      };
    }),

  // List my payments (as brand)
  myPayments: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return await db
      .select()
      .from(payments)
      .where(eq(payments.brandId, ctx.user.id))
      .orderBy(desc(payments.createdAt));
  }),

  // List payments received (as influencer)
  myEarnings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return await db
      .select()
      .from(payments)
      .where(eq(payments.influencerId, ctx.user.id))
      .orderBy(desc(payments.createdAt));
  }),

  // Release payment from escrow to influencer
  release: authedQuery
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [payment] = await db.select().from(payments).where(eq(payments.id, input.paymentId));
      if (!payment || payment.brandId !== ctx.user.id) {
        throw new Error("Payment not found");
      }
      await db
        .update(payments)
        .set({ status: "released", gatewayStatus: "completed", updatedAt: new Date() })
        .where(eq(payments.id, input.paymentId));

      // Notify influencer
      await db.insert(notifications).values({
        userId: payment.influencerId,
        type: "payout_released",
        title: "Payment Released!",
        message: `Your payment of Rs.${payment.amount} has been released from escrow.`,
      });

      return { success: true };
    }),

  // Refund payment
  refund: authedQuery
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [payment] = await db.select().from(payments).where(eq(payments.id, input.paymentId));
      if (!payment || payment.brandId !== ctx.user.id) {
        throw new Error("Payment not found");
      }
      await db
        .update(payments)
        .set({ status: "refunded", gatewayStatus: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, input.paymentId));
      return { success: true };
    }),

  // ─── SUBSCRIPTION PAYMENT FAILURE HANDLING ───

  // Process subscription payment (success)
  processSubscriptionPayment: authedQuery
    .input(z.object({
      userType: z.enum(["brand", "creator"]),
      plan: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const calc = calculateWithGst(input.amount);
      const table = input.userType === "brand" ? brandSubscriptions : creatorSubscriptions;
      const idField = input.userType === "brand" ? brandSubscriptions.brandId : creatorSubscriptions.creatorId;

      await db.update(table).set({
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
      }).where(eq(idField as any, ctx.user.id));

      return { success: true, amount: calc.total, gst: calc.gstAmount };
    }),

  // Handle subscription payment failure
  handlePaymentFailure: authedQuery
    .input(z.object({ userType: z.enum(["brand", "creator"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const table = input.userType === "brand" ? brandSubscriptions : creatorSubscriptions;
      const idField = input.userType === "brand" ? brandSubscriptions.brandId : creatorSubscriptions.creatorId;

      const [sub] = await db.select().from(table).where(eq(idField as any, ctx.user.id));
      if (!sub) return { error: "No subscription found" };

      const newFailCount = (sub.failedPaymentCount ?? 0) + 1;

      if (newFailCount >= 3) {
        // Downgrade to free after 3 failures
        await db.update(table).set({
          plan: "free",
          status: "expired",
          lastPaymentStatus: "failed",
          failedPaymentCount: newFailCount,
          downgradeScheduledAt: new Date(),
        }).where(eq(idField as any, ctx.user.id));

        await db.insert(notifications).values({
          userId: ctx.user.id,
          type: "subscription_downgraded",
          title: "Subscription Downgraded",
          message: "Your subscription has been downgraded to Free due to 3 failed payment attempts. Please update your payment method to continue enjoying premium features.",
          actionUrl: "/pricing",
        });

        return { downgraded: true, message: "Downgraded to free plan" };
      }

      // Set grace period and send reminder
      const graceEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.update(table).set({
        lastPaymentStatus: "failed",
        failedPaymentCount: newFailCount,
        gracePeriodEndsAt: graceEnds,
        reminderSentAt: new Date(),
      }).where(eq(idField as any, ctx.user.id));

      await db.insert(notifications).values({
        userId: ctx.user.id,
        type: "payment_failed",
        title: `Payment Failed (Attempt ${newFailCount}/3)`,
        message: `Your subscription payment could not be processed. You have a 7-day grace period. Please update your payment method to avoid downgrade.`,
        actionUrl: "/pricing",
      });

      return { gracePeriod: true, graceEnds, attemptsLeft: 3 - newFailCount };
    }),

  // ─── ADMIN ENDPOINTS ───

  // Admin: list all payments
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }),

  // Admin: payment analytics
  adminAnalytics: adminQuery.query(async () => {
    const db = getDb();
    const [totalRev] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments);
    const [gstCollected] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.gstAmount}), 0)` }).from(payments);
    const [escrowTotal] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "escrow"));
    const [releasedTotal] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "released"));
    const [refundedTotal] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "refunded"));
    const totalCount = await db.select({ count: sql<number>`COUNT(*)` }).from(payments);

    return {
      totalRevenue: totalRev?.total ?? 0,
      gstCollected: gstCollected?.total ?? 0,
      inEscrow: escrowTotal?.total ?? 0,
      released: releasedTotal?.total ?? 0,
      refunded: refundedTotal?.total ?? 0,
      totalTransactions: totalCount[0]?.count ?? 0,
      gstRate: GST_RATE,
    };
  }),
});
