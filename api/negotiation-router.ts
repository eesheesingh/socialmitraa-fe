import { z } from "zod";
import { createRouter, authedQuery, brandQuery, influencerQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { negotiationSessions, influencerProfiles, campaigns, campaignApplications, creditScores } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── AI Negotiation Engine ───
// Calculates fair market rate based on multiple factors
async function calculateMarketRate(
  db: any,
  campaignId: number,
  influencerId: number
): Promise<{ benchmarkRate: number; reasoning: string; minRate: number; maxRate: number }> {
  // Get influencer profile
  const [profile] = await db
    .select()
    .from(influencerProfiles)
    .where(eq(influencerProfiles.userId, influencerId));

  // Get campaign details
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  // Get credit score
  const [creditScore] = await db
    .select()
    .from(creditScores)
    .where(eq(creditScores.creatorId, influencerId));

  const followers = profile?.igTotalFollowers ?? profile?.followerCount ?? 10000;
  const engagementRate = parseFloat(profile?.igEngagementRate?.toString() ?? profile?.engagementRate?.toString() ?? "3");
  const creditScoreValue = creditScore?.overallScore ?? 500;
  const niche = profile?.niche ?? "general";

  // Base rate calculation (Rs. per 1000 followers)
  const nicheMultipliers: Record<string, number> = {
    fashion: 80, beauty: 75, fitness: 70, food: 65, travel: 60,
    technology: 90, finance: 100, education: 55, gaming: 50, lifestyle: 55,
    luxury: 120, business: 85, health: 70, sports: 60,
  };

  const baseRatePerK = nicheMultipliers[niche.toLowerCase()] ?? 55;

  // Engagement multiplier
  let engagementMultiplier = 1.0;
  if (engagementRate >= 5) engagementMultiplier = 1.5;
  else if (engagementRate >= 3) engagementMultiplier = 1.25;
  else if (engagementRate >= 2) engagementMultiplier = 1.1;
  else if (engagementRate >= 1) engagementMultiplier = 0.9;
  else engagementMultiplier = 0.7;

  // Credit score multiplier
  let creditMultiplier = 1.0;
  if (creditScoreValue >= 750) creditMultiplier = 1.2;
  else if (creditScoreValue >= 600) creditMultiplier = 1.1;
  else if (creditScoreValue >= 450) creditMultiplier = 1.0;
  else if (creditScoreValue >= 300) creditMultiplier = 0.85;
  else creditMultiplier = 0.7;

  // Calculate benchmark rate for 1 post
  const followersInK = followers / 1000;
  const benchmarkRate = Math.round(followersInK * baseRatePerK * engagementMultiplier * creditMultiplier);

  // Reasoning
  const reasons: string[] = [];
  reasons.push(`Based on ${followers.toLocaleString()} followers in the ${niche} niche`);
  reasons.push(`Engagement rate of ${engagementRate}% (${engagementMultiplier > 1 ? "above" : "at"} market average)`);
  reasons.push(`Mitraa Score of ${creditScoreValue} (${creditScore?.scoreCategory ?? "average"})`);
  reasons.push(`Market rate for ${niche} creators: Rs.${baseRatePerK} per 1K followers`);

  // Campaign type adjustment
  const campaignNiche = campaign?.niche;
  if (campaignNiche && campaignNiche.toLowerCase() === niche.toLowerCase()) {
    reasons.push("Perfect niche match — premium rate applicable");
  }

  return {
    benchmarkRate,
    reasoning: reasons.join(". ") + ".",
    minRate: Math.round(benchmarkRate * 0.7),
    maxRate: Math.round(benchmarkRate * 1.3),
  };
}

export const negotiationRouter = createRouter({
  // ─── Brand: Start negotiation with a creator ───
  startNegotiation: brandQuery
    .input(z.object({
      campaignId: z.number(),
      influencerId: z.number(),
      budgetMin: z.number(),
      budgetMax: z.number(),
      deliverables: z.array(z.string()),
      urgency: z.enum(["low", "medium", "high"]).default("medium"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify brand owns campaign
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
      if (!campaign || campaign.brandId !== ctx.user.id) throw new Error("Unauthorized");

      // Check if negotiation already exists
      const [existing] = await db
        .select()
        .from(negotiationSessions)
        .where(and(
          eq(negotiationSessions.campaignId, input.campaignId),
          eq(negotiationSessions.influencerId, input.influencerId)
        ));
      if (existing) return { error: "Negotiation already in progress", sessionId: existing.id };

      // Get creator's asking rate from profile
      const [profile] = await db
        .select()
        .from(influencerProfiles)
        .where(eq(influencerProfiles.userId, input.influencerId));

      const creatorRate = profile?.ratePerPost ?? profile?.ratePerReel ?? 0;

      // Calculate AI suggested rate
      const aiCalc = await calculateMarketRate(db, input.campaignId, input.influencerId);

      // Apply urgency adjustment
      let urgencyMultiplier = 1;
      if (input.urgency === "high") urgencyMultiplier = 1.15;
      else if (input.urgency === "low") urgencyMultiplier = 0.9;

      const aiSuggestedRate = Math.round(aiCalc.benchmarkRate * urgencyMultiplier);

      // Create session
      const result = await db.insert(negotiationSessions).values({
        campaignId: input.campaignId,
        brandId: ctx.user.id,
        influencerId: input.influencerId,
        brandBudgetMin: input.budgetMin.toString(),
        brandBudgetMax: input.budgetMax.toString(),
        brandDeliverables: input.deliverables,
        brandUrgency: input.urgency,
        creatorAskingRate: creatorRate.toString(),
        creatorMinimumRate: Math.round(creatorRate * 0.8).toString(),
        aiSuggestedRate: aiSuggestedRate.toString(),
        aiReasoning: aiCalc.reasoning,
        marketBenchmarkRate: aiCalc.benchmarkRate.toString(),
        status: "ai_negotiating",
        messages: [{ sender: "ai", message: `I've analyzed the market data. Based on ${aiCalc.reasoning}, I suggest a rate of Rs.${aiSuggestedRate.toLocaleString()}. This is within the brand's budget of Rs.${input.budgetMin.toLocaleString()}-${input.budgetMax.toLocaleString()}.`, timestamp: new Date().toISOString() }],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hour expiry
      }).returning({ insertId: negotiationSessions.id });

      return { success: true, sessionId: Number(result[0].insertId), aiSuggestedRate, reasoning: aiCalc.reasoning };
    }),

  // ─── Brand: Accept AI suggestion ───
  brandAccept: brandQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, input.sessionId));
      if (!session || session.brandId !== ctx.user.id) throw new Error("Unauthorized");

      const messages = (session.messages as any[]) ?? [];
      messages.push({ sender: "brand", message: `Brand accepts the AI suggestion of Rs.${parseFloat(session.aiSuggestedRate?.toString() ?? "0").toLocaleString()}`, timestamp: new Date().toISOString() });

      await db.update(negotiationSessions).set({
        status: "brand_accepted",
        agreedRate: session.aiSuggestedRate,
        messages,
      }).where(eq(negotiationSessions.id, input.sessionId));

      return { success: true };
    }),

  // ─── Brand: Counter offer ───
  brandCounter: brandQuery
    .input(z.object({ sessionId: z.number(), counterRate: z.number(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, input.sessionId));
      if (!session || session.brandId !== ctx.user.id) throw new Error("Unauthorized");

      const messages = (session.messages as any[]) ?? [];
      messages.push({ sender: "brand", message: input.message ?? `Brand offers Rs.${input.counterRate.toLocaleString()}`, timestamp: new Date().toISOString() });

      // AI responds to counter
      const aiResponse = generateAIResponse(input.counterRate, parseFloat(session.creatorAskingRate?.toString() ?? "0"), parseFloat(session.marketBenchmarkRate?.toString() ?? "0"));
      messages.push({ sender: "ai", message: aiResponse, timestamp: new Date().toISOString() });

      await db.update(negotiationSessions).set({
        status: "ai_negotiating",
        messages,
      }).where(eq(negotiationSessions.id, input.sessionId));

      return { success: true, aiResponse };
    }),

  // ─── Influencer: Respond to negotiation ───
  creatorRespond: influencerQuery
    .input(z.object({ sessionId: z.number(), action: z.enum(["accept", "counter", "reject"]), counterRate: z.number().optional(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, input.sessionId));
      if (!session || session.influencerId !== ctx.user.id) throw new Error("Unauthorized");

      const messages = (session.messages as any[]) ?? [];

      if (input.action === "accept") {
        messages.push({ sender: "creator", message: input.message ?? `Creator accepts Rs.${parseFloat(session.agreedRate?.toString() ?? session.aiSuggestedRate?.toString() ?? "0").toLocaleString()}`, timestamp: new Date().toISOString() });

        await db.update(negotiationSessions).set({
          status: "both_accepted",
          agreedRate: session.agreedRate ?? session.aiSuggestedRate,
          messages,
        }).where(eq(negotiationSessions.id, input.sessionId));

        // Create campaign application
        await db.insert(campaignApplications).values({
          campaignId: session.campaignId,
          influencerId: ctx.user.id,
          proposedRate: session.agreedRate ?? session.aiSuggestedRate,
          status: "accepted",
        });

        return { success: true, status: "both_accepted" };
      }

      if (input.action === "counter" && input.counterRate) {
        messages.push({ sender: "creator", message: input.message ?? `Creator counters with Rs.${input.counterRate.toLocaleString()}`, timestamp: new Date().toISOString() });

        // AI mediates
        const aiResponse = generateAIResponseForCreator(input.counterRate, parseFloat(session.brandBudgetMax?.toString() ?? "0"), parseFloat(session.marketBenchmarkRate?.toString() ?? "0"));
        messages.push({ sender: "ai", message: aiResponse, timestamp: new Date().toISOString() });

        await db.update(negotiationSessions).set({
          status: "ai_negotiating",
          creatorAskingRate: input.counterRate.toString(),
          messages,
        }).where(eq(negotiationSessions.id, input.sessionId));

        return { success: true, aiResponse };
      }

      if (input.action === "reject") {
        messages.push({ sender: "creator", message: input.message ?? "Creator declined the offer", timestamp: new Date().toISOString() });
        await db.update(negotiationSessions).set({ status: "rejected", messages }).where(eq(negotiationSessions.id, input.sessionId));
        return { success: true, status: "rejected" };
      }

      return { error: "Invalid action" };
    }),

  // ─── Get my negotiations ───
  myNegotiations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const isBrand = ctx.user.role === "brand";
    const field = isBrand ? negotiationSessions.brandId : negotiationSessions.influencerId;

    const sessions = await db
      .select()
      .from(negotiationSessions)
      .where(eq(field, ctx.user.id))
      .orderBy(desc(negotiationSessions.createdAt));

    return sessions;
  }),

  // ─── Get negotiation details ───
  getSession: authedQuery
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, input.sessionId));
      if (!session) return null;
      if (session.brandId !== ctx.user.id && session.influencerId !== ctx.user.id) throw new Error("Unauthorized");
      return session;
    }),
});

// ─── AI Response Generators ───
function generateAIResponse(brandOffer: number, creatorAsk: number, marketRate: number): string {
  const ratio = brandOffer / marketRate;
  if (ratio >= 0.95) return `This offer of Rs.${brandOffer.toLocaleString()} is very close to the market rate of Rs.${marketRate.toLocaleString()}. The creator should find this fair.`;
  if (ratio >= 0.8) return `This offer of Rs.${brandOffer.toLocaleString()} is reasonable — about ${Math.round(ratio * 100)}% of the market rate. The creator may accept or counter slightly.`;
  if (ratio >= 0.6) return `This offer is below market rate. Consider increasing to at least Rs.${Math.round(marketRate * 0.8).toLocaleString()} for a higher acceptance chance.`;
  return `This offer is significantly below market rate. The creator's asking rate is Rs.${creatorAsk.toLocaleString()}. I recommend Rs.${Math.round(marketRate).toLocaleString()} as a fair middle ground.`;
}

function generateAIResponseForCreator(creatorCounter: number, brandMax: number, marketRate: number): string {
  if (creatorCounter <= brandMax) return `The creator's counter of Rs.${creatorCounter.toLocaleString()} is within your budget! This is a good deal — only ${Math.round((creatorCounter / marketRate) * 100)}% of market rate.`;
  const diff = creatorCounter - brandMax;
  return `The creator countered with Rs.${creatorCounter.toLocaleString()}, which is Rs.${diff.toLocaleString()} above your max budget. Market rate is Rs.${marketRate.toLocaleString()}. You could meet halfway at Rs.${Math.round((creatorCounter + brandMax) / 2).toLocaleString()}.`;
}
