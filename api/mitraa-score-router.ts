import { z } from "zod";
import { createRouter, authedQuery, influencerQuery, brandQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { creditScores, influencerProfiles, campaignApplications, payments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Mitraa Score Engine (0-900)
 * India's first creator trust score — evaluates collaboration reliability
 */

interface ScoreComponents {
  contentConsistency: number; // 0-100
  brandReliability: number; // 0-100
  audienceQuality: number; // 0-100
  engagementAuthenticity: number; // 0-100
  financialReliability: number; // 0-100
  compliance: number; // 0-100
  growthVelocity: number; // 0-100
  platformDiversity: number; // 0-100
}

function calculateScoreComponents(profile: any, applications: any[], paymentsData: any[]): ScoreComponents {
  // 1. Content Consistency (0-100) — based on post frequency
  let contentConsistency = 50;
  const postFreq = parseFloat(profile.igPostFrequency?.toString() ?? "0");
  if (postFreq >= 5) contentConsistency = 95;
  else if (postFreq >= 3) contentConsistency = 85;
  else if (postFreq >= 2) contentConsistency = 70;
  else if (postFreq >= 1) contentConsistency = 55;
  else contentConsistency = 35;

  // 2. Brand Reliability (0-100) — on-time delivery, completion rate
  let brandReliability = 60;
  if (applications.length > 0) {
    const completed = applications.filter((a) => a.status === "completed").length;
    const accepted = applications.filter((a) => a.status === "accepted" || a.status === "completed").length;
    const completionRate = accepted > 0 ? completed / accepted : 0;
    brandReliability = Math.round(50 + completionRate * 50);
  }
  // Add bonus for multiple successful collaborations
  const successfulCollabs = applications.filter((a) => a.status === "completed").length;
  if (successfulCollabs >= 10) brandReliability = Math.min(100, brandReliability + 10);
  if (successfulCollabs >= 5) brandReliability = Math.min(100, brandReliability + 5);

  // 3. Audience Quality (0-100) — inverse of fake follower %
  const fakePct = profile.igFakeFollowerPercentage ?? 50;
  const audienceQuality = Math.max(0, 100 - fakePct);

  // 4. Engagement Authenticity (0-100)
  let engagementAuthenticity = 50;
  const engRate = parseFloat(profile.igEngagementRate?.toString() ?? profile.engagementRate?.toString() ?? "0");
  if (engRate >= 5) engagementAuthenticity = 95;
  else if (engRate >= 3) engagementAuthenticity = 85;
  else if (engRate >= 2) engagementAuthenticity = 70;
  else if (engRate >= 1) engagementAuthenticity = 55;
  else engagementAuthenticity = 35;

  // Penalize suspicious engagement patterns
  const avgLikes = profile.igAvgLikes ?? profile.avgLikes ?? 0;
  const avgComments = profile.igAvgComments ?? profile.avgComments ?? 0;
  if (avgLikes > 0 && avgComments > 0) {
    const ratio = avgLikes / avgComments;
    if (ratio > 200) engagementAuthenticity -= 20; // Too many likes vs comments
    else if (ratio > 100) engagementAuthenticity -= 10;
  }

  // 5. Financial Reliability (0-100) — payment history
  let financialReliability = 60;
  if (paymentsData.length > 0) {
    const onTimePayments = paymentsData.filter((p) => p.status === "released").length;
    financialReliability = Math.round(60 + (onTimePayments / Math.max(paymentsData.length, 1)) * 40);
  }

  // 6. Compliance (0-100) — ASCI guidelines, professional behavior
  let compliance = 75; // Base
  if (profile.bio && profile.bio.length > 20) compliance += 5;
  if (profile.categories && (profile.categories as string[]).length >= 1) compliance += 5;
  if (successfulCollabs >= 3) compliance += 10;
  compliance = Math.min(100, compliance);

  // 7. Growth Velocity (0-100)
  let growthVelocity = 50;
  const followers = profile.igTotalFollowers ?? profile.followerCount ?? 0;
  if (followers >= 100000) growthVelocity = 90;
  else if (followers >= 50000) growthVelocity = 80;
  else if (followers >= 10000) growthVelocity = 70;
  else if (followers >= 5000) growthVelocity = 60;
  else if (followers >= 1000) growthVelocity = 50;
  else growthVelocity = 30;

  // 8. Platform Diversity (0-100)
  let platformDiversity = 30;
  const platforms = profile.platforms ? (profile.platforms as string[]) : [];
  if (platforms.length >= 4) platformDiversity = 95;
  else if (platforms.length >= 3) platformDiversity = 80;
  else if (platforms.length >= 2) platformDiversity = 65;
  else if (platforms.length >= 1) platformDiversity = 45;

  // Bonus for having multiple social IDs filled
  let socialCount = 0;
  if (profile.instagramId) socialCount++;
  if (profile.youtubeId) socialCount++;
  if (profile.facebookId) socialCount++;
  if (profile.tiktokId) socialCount++;
  if (profile.twitterId) socialCount++;
  if (socialCount >= 3) platformDiversity = Math.min(100, platformDiversity + 10);

  return {
    contentConsistency,
    brandReliability,
    audienceQuality,
    engagementAuthenticity,
    financialReliability,
    compliance,
    growthVelocity,
    platformDiversity,
  };
}

function getPositiveFactors(components: ScoreComponents, successfulCollabs: number): string[] {
  const factors: string[] = [];
  if (components.contentConsistency >= 80) factors.push("Consistent content posting schedule");
  if (components.brandReliability >= 80) factors.push("Strong brand collaboration history");
  if (components.audienceQuality >= 80) factors.push("High-quality authentic audience");
  if (components.engagementAuthenticity >= 80) factors.push("Authentic engagement patterns");
  if (components.financialReliability >= 80) factors.push("Reliable payment track record");
  if (components.compliance >= 80) factors.push("Professional profile & compliance");
  if (components.growthVelocity >= 80) factors.push("Strong follower growth trajectory");
  if (components.platformDiversity >= 70) factors.push("Multi-platform presence");
  if (successfulCollabs >= 5) factors.push(`${successfulCollabs}+ successful brand collaborations`);
  return factors.length > 0 ? factors : ["Active on the platform"];
}

function getNegativeFactors(components: ScoreComponents): string[] {
  const factors: string[] = [];
  if (components.contentConsistency < 50) factors.push("Inconsistent posting schedule");
  if (components.brandReliability < 60) factors.push("Limited brand collaboration history");
  if (components.audienceQuality < 60) factors.push("Audience quality needs improvement");
  if (components.engagementAuthenticity < 50) factors.push("Engagement patterns may be inauthentic");
  if (components.financialReliability < 60) factors.push("Limited payment history");
  if (components.platformDiversity < 40) factors.push("Limited platform presence");
  return factors.length > 0 ? factors : ["Score based on limited data — improve by completing more collaborations"];
}

function getImprovementTips(components: ScoreComponents): string[] {
  const tips: string[] = [];
  if (components.contentConsistency < 70) tips.push("Post at least 3 times per week to improve consistency");
  if (components.brandReliability < 70) tips.push("Complete brand collaborations on time to build reliability");
  if (components.audienceQuality < 70) tips.push("Focus on organic growth — avoid purchasing followers");
  if (components.engagementAuthenticity < 70) tips.push("Create content that encourages genuine comments");
  if (components.platformDiversity < 60) tips.push("Add more social media platforms to your profile");
  if (components.compliance < 80) tips.push("Add a detailed bio and select content categories");
  return tips.length > 0 ? tips : ["Keep collaborating to build your Mitraa Score"];
}

function getCategory(score: number): string {
  if (score >= 750) return "excellent";
  if (score >= 600) return "good";
  if (score >= 450) return "average";
  if (score >= 300) return "poor";
  return "risk";
}

export const mitraaScoreRouter = createRouter({
  // ─── Calculate Mitraa Score for a creator ───
  calculate: influencerQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const creatorId = ctx.user.id;

    // Get profile
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, creatorId));
    if (!profile) throw new Error("Profile not found");

    // Get collaboration history
    const applications = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.influencerId, creatorId));

    // Get payment history
    const paymentsData = await db
      .select()
      .from(payments)
      .where(eq(payments.influencerId, creatorId));

    const components = calculateScoreComponents(profile, applications, paymentsData);
    const successfulCollabs = applications.filter((a) => a.status === "completed").length;

    // Calculate overall score (0-900)
    // Weighted: audienceQuality 20%, engagement 15%, brandReliability 15%, contentConsistency 12.5%,
    // financial 12.5%, compliance 10%, growth 7.5%, platformDiversity 7.5%
    const weights = {
      audienceQuality: 0.20,
      engagementAuthenticity: 0.15,
      brandReliability: 0.15,
      contentConsistency: 0.125,
      financialReliability: 0.125,
      compliance: 0.10,
      growthVelocity: 0.075,
      platformDiversity: 0.075,
    };

    const overallScore = Math.round(
      components.audienceQuality * weights.audienceQuality * 9 +
      components.engagementAuthenticity * weights.engagementAuthenticity * 9 +
      components.brandReliability * weights.brandReliability * 9 +
      components.contentConsistency * weights.contentConsistency * 9 +
      components.financialReliability * weights.financialReliability * 9 +
      components.compliance * weights.compliance * 9 +
      components.growthVelocity * weights.growthVelocity * 9 +
      components.platformDiversity * weights.platformDiversity * 9
    );

    const category = getCategory(overallScore);

    // Get existing score for change calculation
    const [existing] = await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.creatorId, creatorId));

    const previousScore = existing?.overallScore ?? 0;
    const scoreChange = overallScore - previousScore;

    // Upsert score
    if (existing) {
      await db.update(creditScores).set({
        overallScore,
        scoreCategory: category,
        contentConsistencyScore: components.contentConsistency,
        brandReliabilityScore: components.brandReliability,
        audienceQualityScore: components.audienceQuality,
        engagementAuthenticityScore: components.engagementAuthenticity,
        financialReliabilityScore: components.financialReliability,
        complianceScore: components.compliance,
        growthVelocityScore: components.growthVelocity,
        platformDiversityScore: components.platformDiversity,
        positiveFactors: getPositiveFactors(components, successfulCollabs),
        negativeFactors: getNegativeFactors(components),
        improvementTips: getImprovementTips(components),
        previousScore,
        scoreChange,
        calculatedAt: new Date(),
        nextCalculationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Recalculate in 7 days
      }).where(eq(creditScores.creatorId, creatorId));
    } else {
      await db.insert(creditScores).values({
        creatorId,
        overallScore,
        scoreCategory: category,
        contentConsistencyScore: components.contentConsistency,
        brandReliabilityScore: components.brandReliability,
        audienceQualityScore: components.audienceQuality,
        engagementAuthenticityScore: components.engagementAuthenticity,
        financialReliabilityScore: components.financialReliability,
        complianceScore: components.compliance,
        growthVelocityScore: components.growthVelocity,
        platformDiversityScore: components.platformDiversity,
        positiveFactors: getPositiveFactors(components, successfulCollabs),
        negativeFactors: getNegativeFactors(components),
        improvementTips: getImprovementTips(components),
        previousScore: 0,
        scoreChange: overallScore,
        nextCalculationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    return { overallScore, category, components, scoreChange };
  }),

  // ─── Get my Mitraa Score ───
  myScore: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [score] = await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.creatorId, ctx.user.id));
    return score ?? null;
  }),

  // ─── Public: Get creator's Mitraa Score ───
  getByCreatorId: publicQuery
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [score] = await db
        .select()
        .from(creditScores)
        .where(eq(creditScores.creatorId, input.creatorId));

      if (!score) return null;

      // Return summary only (detailed breakdown for influencers only)
      return {
        overallScore: score.overallScore,
        scoreCategory: score.scoreCategory,
        scoreChange: score.scoreChange,
        calculatedAt: score.calculatedAt,
        positiveFactors: score.positiveFactors,
      };
    }),

  // ─── Brand: Purchase credit report ───
  purchaseReport: brandQuery
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [score] = await db
        .select()
        .from(creditScores)
        .where(eq(creditScores.creatorId, input.creatorId));

      if (!score) return { error: "No Mitraa Score available for this creator" };

      return {
        overallScore: score.overallScore,
        scoreCategory: score.scoreCategory,
        components: {
          contentConsistency: score.contentConsistencyScore,
          brandReliability: score.brandReliabilityScore,
          audienceQuality: score.audienceQualityScore,
          engagementAuthenticity: score.engagementAuthenticityScore,
          financialReliability: score.financialReliabilityScore,
          compliance: score.complianceScore,
          growthVelocity: score.growthVelocityScore,
          platformDiversity: score.platformDiversityScore,
        },
        positiveFactors: score.positiveFactors,
        negativeFactors: score.negativeFactors,
        improvementTips: score.improvementTips,
        scoreChange: score.scoreChange,
        calculatedAt: score.calculatedAt,
      };
    }),

  // ─── Admin: Get all scores ───
  allScores: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    return db.select().from(creditScores).orderBy(desc(creditScores.overallScore));
  }),
});
