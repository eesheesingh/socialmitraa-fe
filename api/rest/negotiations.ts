import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../queries/connection";
import { negotiationSessions, influencerProfiles, campaigns, campaignApplications, creditScores } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUser, requireAuth, requireRole, handleError } from "./utils";

const app = new Hono();

async function calculateMarketRate(
  db: any,
  campaignId: number,
  influencerId: number
): Promise<{ benchmarkRate: number; reasoning: string; minRate: number; maxRate: number }> {
  const [profile] = await db
    .select()
    .from(influencerProfiles)
    .where(eq(influencerProfiles.userId, influencerId));

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  const [creditScore] = await db
    .select()
    .from(creditScores)
    .where(eq(creditScores.creatorId, influencerId));

  const followers = profile?.igTotalFollowers ?? profile?.followerCount ?? 10000;
  const engagementRate = parseFloat(profile?.igEngagementRate?.toString() ?? profile?.engagementRate?.toString() ?? "3");
  const creditScoreValue = creditScore?.overallScore ?? 500;
  const niche = profile?.niche ?? "general";

  const nicheMultipliers: Record<string, number> = {
    fashion: 80, beauty: 75, fitness: 70, food: 65, travel: 60,
    technology: 90, finance: 100, education: 55, gaming: 50, lifestyle: 55,
    luxury: 120, business: 85, health: 70, sports: 60,
  };

  const baseRatePerK = nicheMultipliers[niche.toLowerCase()] ?? 55;

  let engagementMultiplier = 1.0;
  if (engagementRate >= 5) engagementMultiplier = 1.5;
  else if (engagementRate >= 3) engagementMultiplier = 1.25;
  else if (engagementRate >= 2) engagementMultiplier = 1.1;
  else if (engagementRate >= 1) engagementMultiplier = 0.9;
  else engagementMultiplier = 0.7;

  let creditMultiplier = 1.0;
  if (creditScoreValue >= 750) creditMultiplier = 1.2;
  else if (creditScoreValue >= 600) creditMultiplier = 1.1;
  else if (creditScoreValue >= 450) creditMultiplier = 1.0;
  else if (creditScoreValue >= 300) creditMultiplier = 0.85;
  else creditMultiplier = 0.7;

  const followersInK = followers / 1000;
  const benchmarkRate = Math.round(followersInK * baseRatePerK * engagementMultiplier * creditMultiplier);

  const reasons: string[] = [];
  reasons.push(`Based on ${followers.toLocaleString()} followers in the ${niche} niche`);
  reasons.push(`Engagement rate of ${engagementRate}% (${engagementMultiplier > 1 ? "above" : "at"} market average)`);
  reasons.push(`Mitraa Score of ${creditScoreValue} (${creditScore?.scoreCategory ?? "average"})`);
  reasons.push(`Market rate for ${niche} creators: Rs.${baseRatePerK} per 1K followers`);

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

// GET /api/rest/negotiations
app.get("/", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const db = getDb();
    const isBrand = user.role === "brand";
    const field = isBrand ? negotiationSessions.brandId : negotiationSessions.influencerId;

    const sessions = await db
      .select()
      .from(negotiationSessions)
      .where(eq(field, user.id))
      .orderBy(desc(negotiationSessions.createdAt));

    return c.json(sessions);
  } catch (error) {
    return handleError(c, error);
  }
});

// GET /api/rest/negotiations/:id
app.get("/:id", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    const id = parseInt(c.req.param("id"));
    const db = getDb();

    const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, id));
    if (!session) return c.json(null);
    if (session.brandId !== user.id && session.influencerId !== user.id) throw new Error("Unauthorized");

    return c.json(session);
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/negotiations
app.post("/", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "brand");
    const input = z.object({
      campaignId: z.number(),
      influencerId: z.number(),
      budgetMin: z.number(),
      budgetMax: z.number(),
      deliverables: z.array(z.string()),
      urgency: z.enum(["low", "medium", "high"]).default("medium"),
    }).parse(await c.req.json());

    const db = getDb();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
    if (!campaign || campaign.brandId !== user.id) throw new Error("Unauthorized");

    const [existing] = await db
      .select()
      .from(negotiationSessions)
      .where(and(
        eq(negotiationSessions.campaignId, input.campaignId),
        eq(negotiationSessions.influencerId, input.influencerId)
      ));
    if (existing) return c.json({ error: "Negotiation already in progress", sessionId: existing.id });

    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, input.influencerId));

    const creatorRate = profile?.ratePerPost ?? profile?.ratePerReel ?? 0;
    const aiCalc = await calculateMarketRate(db, input.campaignId, input.influencerId);

    let urgencyMultiplier = 1;
    if (input.urgency === "high") urgencyMultiplier = 1.15;
    else if (input.urgency === "low") urgencyMultiplier = 0.9;

    const aiSuggestedRate = Math.round(aiCalc.benchmarkRate * urgencyMultiplier);

    const result = await db.insert(negotiationSessions).values({
      campaignId: input.campaignId,
      brandId: user.id,
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
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }).returning({ insertId: negotiationSessions.id });

    return c.json({ success: true, sessionId: Number(result[0].insertId), aiSuggestedRate, reasoning: aiCalc.reasoning });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/negotiations/:id/accept
app.post("/:id/accept", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "brand");
    const sessionId = parseInt(c.req.param("id"));
    const db = getDb();

    const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, sessionId));
    if (!session || session.brandId !== user.id) throw new Error("Unauthorized");

    const messages = (session.messages as any[]) ?? [];
    messages.push({ sender: "brand", message: `Brand accepts the AI suggestion of Rs.${parseFloat(session.aiSuggestedRate?.toString() ?? "0").toLocaleString()}`, timestamp: new Date().toISOString() });

    await db.update(negotiationSessions).set({
      status: "brand_accepted",
      agreedRate: session.aiSuggestedRate,
      messages,
    }).where(eq(negotiationSessions.id, sessionId));

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/negotiations/:id/counter
app.post("/:id/counter", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "brand");
    const sessionId = parseInt(c.req.param("id"));
    const input = z.object({
      counterRate: z.number(),
      message: z.string().optional(),
    }).parse(await c.req.json());

    const db = getDb();
    const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, sessionId));
    if (!session || session.brandId !== user.id) throw new Error("Unauthorized");

    const messages = (session.messages as any[]) ?? [];
    messages.push({ sender: "brand", message: input.message ?? `Brand offers Rs.${input.counterRate.toLocaleString()}`, timestamp: new Date().toISOString() });

    const aiResponse = generateAIResponse(input.counterRate, parseFloat(session.creatorAskingRate?.toString() ?? "0"), parseFloat(session.marketBenchmarkRate?.toString() ?? "0"));
    messages.push({ sender: "ai", message: aiResponse, timestamp: new Date().toISOString() });

    await db.update(negotiationSessions).set({
      status: "ai_negotiating",
      messages,
    }).where(eq(negotiationSessions.id, sessionId));

    return c.json({ success: true, aiResponse });
  } catch (error) {
    return handleError(c, error);
  }
});

// POST /api/rest/negotiations/:id/respond
app.post("/:id/respond", async (c) => {
  try {
    const user = requireAuth(await getUser(c.req.raw));
    requireRole(user, "influencer");
    const sessionId = parseInt(c.req.param("id"));
    const input = z.object({
      action: z.enum(["accept", "counter", "reject"]),
      counterRate: z.number().optional(),
      message: z.string().optional(),
    }).parse(await c.req.json());

    const db = getDb();
    const [session] = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, sessionId));
    if (!session || session.influencerId !== user.id) throw new Error("Unauthorized");

    const messages = (session.messages as any[]) ?? [];

    if (input.action === "accept") {
      messages.push({ sender: "creator", message: input.message ?? `Creator accepts Rs.${parseFloat(session.agreedRate?.toString() ?? session.aiSuggestedRate?.toString() ?? "0").toLocaleString()}`, timestamp: new Date().toISOString() });

      await db.update(negotiationSessions).set({
        status: "both_accepted",
        agreedRate: session.agreedRate ?? session.aiSuggestedRate,
        messages,
      }).where(eq(negotiationSessions.id, sessionId));

      await db.insert(campaignApplications).values({
        campaignId: session.campaignId,
        influencerId: user.id,
        proposedRate: session.agreedRate ?? session.aiSuggestedRate,
        status: "accepted",
      });

      return c.json({ success: true, status: "both_accepted" });
    }

    if (input.action === "counter" && input.counterRate) {
      messages.push({ sender: "creator", message: input.message ?? `Creator counters with Rs.${input.counterRate.toLocaleString()}`, timestamp: new Date().toISOString() });

      const aiResponse = generateAIResponseForCreator(input.counterRate, parseFloat(session.brandBudgetMax?.toString() ?? "0"), parseFloat(session.marketBenchmarkRate?.toString() ?? "0"));
      messages.push({ sender: "ai", message: aiResponse, timestamp: new Date().toISOString() });

      await db.update(negotiationSessions).set({
        status: "ai_negotiating",
        creatorAskingRate: input.counterRate.toString(),
        messages,
      }).where(eq(negotiationSessions.id, sessionId));

      return c.json({ success: true, aiResponse });
    }

    if (input.action === "reject") {
      messages.push({ sender: "creator", message: input.message ?? "Creator declined the offer", timestamp: new Date().toISOString() });
      await db.update(negotiationSessions).set({ status: "rejected", messages }).where(eq(negotiationSessions.id, sessionId));
      return c.json({ success: true, status: "rejected" });
    }

    return c.json({ error: "Invalid action" });
  } catch (error) {
    return handleError(c, error);
  }
});

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

export default app;
