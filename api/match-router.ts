import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brandRequirements, aiMatches, influencerProfiles } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

// 42 Creator categories
export const CREATOR_CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Travel", "Lifestyle",
  "Technology", "Finance", "Education", "Gaming", "Parenting",
  "Photography", "Art", "Music", "Dance", "Comedy", "Motivation",
  "Business", "Health & Wellness", "Sports", "Automotive",
  "Real Estate", "Pets", "DIY & Crafts", "Book & Literature",
  "News & Politics", "Science", "Environment", "Spirituality",
  "Relationships", "Luxury", "Review & Unboxing", "Event Coverage",
  "Cooking & Recipes", "Home Decor", "Gardening", "Astrology",
  "Legal Advice", "Medical & Health", "Entertainment",
  "Vlogging", "Podcasting",
];

// Category similarity matrix — related categories get partial credit
const CATEGORY_RELATIONS: Record<string, string[]> = {
  "Fashion": ["Beauty", "Lifestyle", "Luxury", "Photography"],
  "Beauty": ["Fashion", "Lifestyle", "Photography", "Health & Wellness"],
  "Fitness": ["Health & Wellness", "Sports", "Food", "Lifestyle"],
  "Food": ["Cooking & Recipes", "Lifestyle", "Health & Wellness", "Fitness"],
  "Travel": ["Lifestyle", "Photography", "Food", "Luxury"],
  "Lifestyle": ["Fashion", "Beauty", "Travel", "Food", "Home Decor"],
  "Technology": ["Science", "Business", "Education", "Gaming"],
  "Finance": ["Business", "Education", "Real Estate", "Legal Advice"],
  "Education": ["Science", "Technology", "Business", "Book & Literature"],
  "Gaming": ["Technology", "Entertainment", "Comedy", "Vlogging"],
  "Parenting": ["Relationships", "Lifestyle", "Home Decor", "Education"],
  "Photography": ["Fashion", "Art", "Travel", "Beauty"],
  "Art": ["Photography", "Music", "Dance", "Home Decor"],
  "Music": ["Dance", "Entertainment", "Art", "Vlogging"],
  "Dance": ["Music", "Fitness", "Entertainment", "Art"],
  "Comedy": ["Entertainment", "Vlogging", "Gaming", "Motivation"],
  "Motivation": ["Business", "Fitness", "Education", "Comedy"],
  "Business": ["Finance", "Technology", "Motivation", "Education"],
  "Health & Wellness": ["Fitness", "Medical & Health", "Food", "Lifestyle"],
  "Sports": ["Fitness", "Health & Wellness", "Entertainment"],
  "Automotive": ["Technology", "Luxury", "Review & Unboxing"],
  "Real Estate": ["Finance", "Home Decor", "Luxury"],
  "Pets": ["Lifestyle", "Photography", "Parenting"],
  "DIY & Crafts": ["Home Decor", "Art", "Gardening"],
  "Book & Literature": ["Education", "Astrology", "Relationships"],
  "News & Politics": ["Science", "Legal Advice", "Relationships"],
  "Science": ["Technology", "Education", "Medical & Health", "News & Politics"],
  "Environment": ["Science", "Gardening", "Lifestyle"],
  "Spirituality": ["Astrology", "Relationships", "Motivation"],
  "Relationships": ["Parenting", "Spirituality", "Book & Literature", "Lifestyle"],
  "Luxury": ["Fashion", "Automotive", "Real Estate", "Travel"],
  "Review & Unboxing": ["Technology", "Automotive", "Photography"],
  "Event Coverage": ["Photography", "Vlogging", "Music"],
  "Cooking & Recipes": ["Food", "Health & Wellness", "Lifestyle"],
  "Home Decor": ["DIY & Crafts", "Real Estate", "Art", "Gardening"],
  "Gardening": ["Home Decor", "Environment", "DIY & Crafts"],
  "Astrology": ["Spirituality", "Relationships", "Entertainment"],
  "Legal Advice": ["Finance", "News & Politics", "Business"],
  "Medical & Health": ["Health & Wellness", "Science", "Fitness"],
  "Entertainment": ["Comedy", "Music", "Gaming", "Vlogging", "Dance"],
  "Vlogging": ["Entertainment", "Travel", "Gaming", "Comedy"],
  "Podcasting": ["Business", "Education", "Motivation", "Relationships"],
};

// Learning weights that adapt based on past match outcomes
interface LearningWeights {
  categoryWeight: number;
  followerWeight: number;
  engagementWeight: number;
  locationWeight: number;
  budgetWeight: number;
  platformWeight: number;
  historicalRoiWeight: number;
}

// Default weights
const DEFAULT_WEIGHTS: LearningWeights = {
  categoryWeight: 0.25,
  followerWeight: 0.18,
  engagementWeight: 0.20,
  locationWeight: 0.10,
  budgetWeight: 0.12,
  platformWeight: 0.08,
  historicalRoiWeight: 0.07,
};

// Get learning-adjusted weights based on past match outcomes
async function getAdaptiveWeights(db: any): Promise<LearningWeights> {
  try {
    // Count outcomes
    const acceptedCount = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "accepted"));
    const declinedCount = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "declined"));
    const invitedCount = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "invited"));
    
    const accepted = acceptedCount[0]?.count ?? 0;
    const declined = declinedCount[0]?.count ?? 0;
    const invited = invitedCount[0]?.count ?? 0;
    const total = accepted + declined + invited;
    
    if (total < 10) return DEFAULT_WEIGHTS; // Not enough data yet
    
    const acceptRate = accepted / total;
    
    // Adjust weights based on what's working
    // If accept rate is low, increase category and engagement weights (stronger signals)
    // If accept rate is high, trust budget and location more
    const adjustment = acceptRate < 0.3 ? 1.2 : acceptRate > 0.6 ? 0.9 : 1.0;
    
    return {
      categoryWeight: Math.min(0.35, DEFAULT_WEIGHTS.categoryWeight * adjustment),
      followerWeight: DEFAULT_WEIGHTS.followerWeight,
      engagementWeight: Math.min(0.28, DEFAULT_WEIGHTS.engagementWeight * adjustment),
      locationWeight: acceptRate > 0.5 ? 0.12 : DEFAULT_WEIGHTS.locationWeight,
      budgetWeight: acceptRate > 0.5 ? 0.15 : DEFAULT_WEIGHTS.budgetWeight,
      platformWeight: DEFAULT_WEIGHTS.platformWeight,
      historicalRoiWeight: total > 20 ? 0.10 : DEFAULT_WEIGHTS.historicalRoiWeight,
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

// Enhanced category matching with related categories
function calculateCategoryMatch(reqCategories: string[], infCategories: string[]): number {
  if (reqCategories.length === 0 || infCategories.length === 0) return 50;
  
  let totalScore = 0;
  let totalPossible = 0;
  
  for (const reqCat of reqCategories) {
    let bestMatch = 0;
    const related = CATEGORY_RELATIONS[reqCat] ?? [];
    
    for (const infCat of infCategories) {
      if (infCat === reqCat) {
        bestMatch = 100; // Exact match
        break;
      }
      if (related.includes(infCat)) {
        bestMatch = Math.max(bestMatch, 60); // Related category
      }
    }
    
    totalScore += bestMatch;
    totalPossible += 100;
  }
  
  return totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 50;
}

// Calculate creator's historical ROI score
function calculateHistoricalRoi(influencer: typeof influencerProfiles.$inferSelect): number {
  const engagement = parseFloat(influencer.engagementRate?.toString() ?? "0");
  const followers = influencer.followerCount ?? 0;
  const avgLikes = influencer.avgLikes ?? 0;
  const avgComments = influencer.avgComments ?? 0;
  
  // ROI Score based on engagement quality and consistency
  let roiScore = 50; // base
  
  if (engagement > 5) roiScore += 20;
  else if (engagement > 3) roiScore += 10;
  else if (engagement > 1) roiScore += 5;
  
  // Comment-to-like ratio indicates genuine engagement
  if (avgLikes > 0 && avgComments > 0) {
    const commentRatio = avgComments / avgLikes;
    if (commentRatio > 0.05) roiScore += 15;
    else if (commentRatio > 0.02) roiScore += 8;
  }
  
  // Follower quality (micro-influencers often have better ROI)
  if (followers >= 10000 && followers <= 100000) roiScore += 10;
  
  return Math.min(100, roiScore);
}

// Main AI matching algorithm
async function calculateEnhancedMatchScore(
  requirement: typeof brandRequirements.$inferSelect,
  influencer: typeof influencerProfiles.$inferSelect,
  weights: LearningWeights
): Promise<{
  totalScore: number;
  categoryMatch: number;
  followerMatch: number;
  engagementMatch: number;
  locationMatch: number;
  budgetMatch: number;
  platformMatch: number;
  roiScore: number;
  reason: string;
  insights: string[];
}> {
  const reasons: string[] = [];
  const insights: string[] = [];
  
  // 1. Category Match (with related categories)
  const reqCategories = requirement.creatorCategories ?? [];
  const infCategories = influencer.categories ?? [];
  const categoryMatch = calculateCategoryMatch(reqCategories, infCategories);
  
  const exactMatches = reqCategories.filter(c => infCategories.includes(c));
  const relatedMatches = reqCategories.filter(c => {
    if (infCategories.includes(c)) return false;
    const related = CATEGORY_RELATIONS[c] ?? [];
    return infCategories.some(ic => related.includes(ic));
  });
  
  if (exactMatches.length > 0) reasons.push(`Exact category match: ${exactMatches.slice(0, 3).join(", ")}`);
  if (relatedMatches.length > 0) insights.push(`Related expertise: ${relatedMatches.slice(0, 2).join(", ")}`);
  
  // 2. Follower Match
  const followers = influencer.followerCount ?? 0;
  const minF = requirement.minFollowers ?? 0;
  const maxF = requirement.maxFollowers ?? 100000000;
  let followerMatch = 50;
  
  if (followers >= minF && followers <= maxF) {
    followerMatch = 100;
    reasons.push(`${followers.toLocaleString()} followers within target range`);
  } else if (followers >= minF * 0.7 && followers <= maxF * 1.5) {
    followerMatch = 75;
    insights.push(`Follower count near target range`);
  } else if (minF > 0) {
    followerMatch = Math.max(10, 100 - Math.floor(Math.abs(followers - (minF + maxF) / 2) / Math.max(1000, (maxF - minF) / 4)));
  }
  
  // 3. Engagement Match
  const engagement = parseFloat(influencer.engagementRate?.toString() ?? "0");
  const minE = parseFloat(requirement.minEngagementRate?.toString() ?? "0");
  let engagementMatch = 50;
  
  if (minE > 0) {
    if (engagement >= minE) {
      engagementMatch = Math.min(100, 70 + Math.floor((engagement - minE) * 10));
      reasons.push(`Engagement rate ${engagement}% exceeds ${minE}% requirement`);
    } else if (engagement >= minE * 0.7) {
      engagementMatch = 60;
      insights.push(`Engagement rate ${engagement}% approaching target`);
    } else {
      engagementMatch = Math.max(10, Math.round((engagement / minE) * 70));
    }
  } else {
    // No minimum set, score based on absolute engagement quality
    engagementMatch = engagement > 5 ? 90 : engagement > 3 ? 75 : engagement > 1 ? 60 : 40;
    if (engagement > 3) reasons.push(`Strong engagement rate: ${engagement}%`);
  }
  
  // 4. Location Match
  let locationMatch = 50;
  if (requirement.preferredLocation && influencer.location) {
    const reqLoc = requirement.preferredLocation.toLowerCase();
    const infLoc = influencer.location.toLowerCase();
    if (infLoc.includes(reqLoc) || reqLoc.includes(infLoc)) {
      locationMatch = 100;
      reasons.push(`Based in ${influencer.location}`);
    } else {
      locationMatch = 25;
      insights.push(`Different location: ${influencer.location}`);
    }
  }
  if (requirement.preferredLocation && influencer.city) {
    const reqLoc = requirement.preferredLocation.toLowerCase();
    const infCity = influencer.city.toLowerCase();
    if (infCity.includes(reqLoc) || reqLoc.includes(infCity)) {
      locationMatch = 100;
      reasons.push(`Based in ${influencer.city}`);
    }
  }
  
  // 5. Budget Match
  const budgetPerCreator = parseFloat(requirement.budgetPerCreator?.toString() ?? "0");
  const ratePerReel = parseFloat(influencer.ratePerReel?.toString() ?? "0");
  const ratePerPost = parseFloat(influencer.ratePerPost?.toString() ?? "0");
  const avgRate = ratePerReel > 0 && ratePerPost > 0 ? (ratePerReel + ratePerPost) / 2 : ratePerReel || ratePerPost;
  let budgetMatch = 50;
  
  if (budgetPerCreator > 0 && avgRate > 0) {
    if (avgRate <= budgetPerCreator) {
      budgetMatch = Math.min(100, 70 + Math.floor((1 - avgRate / budgetPerCreator) * 30));
      reasons.push(`Rate within budget`);
    } else if (avgRate <= budgetPerCreator * 1.3) {
      budgetMatch = 55;
      insights.push(`Rate slightly above budget`);
    } else {
      budgetMatch = Math.max(10, 100 - Math.round(((avgRate - budgetPerCreator) / budgetPerCreator) * 100));
      insights.push(`Rate above budget range`);
    }
  }
  
  // 6. Platform Match
  const reqPlatforms = requirement.preferredPlatforms ?? [];
  const infPlatforms = influencer.platforms ?? [];
  let platformMatch = 50;
  if (reqPlatforms.length > 0 && infPlatforms.length > 0) {
    const matches = reqPlatforms.filter((p: string) => infPlatforms.includes(p));
    platformMatch = Math.round((matches.length / reqPlatforms.length) * 100);
    if (matches.length > 0) reasons.push(`Active on: ${matches.join(", ")}`);
  }
  
  // 7. Historical ROI Score
  const roiScore = calculateHistoricalRoi(influencer);
  if (roiScore > 75) reasons.push(`High predicted ROI (${roiScore}%)`);
  else if (roiScore > 60) insights.push(`Good engagement quality`);
  
  // Weighted total with adaptive weights
  const totalScore = Math.round(
    categoryMatch * weights.categoryWeight +
    followerMatch * weights.followerWeight +
    engagementMatch * weights.engagementWeight +
    locationMatch * weights.locationWeight +
    budgetMatch * weights.budgetWeight +
    platformMatch * weights.platformWeight +
    roiScore * weights.historicalRoiWeight
  );
  
  const reason = reasons.length > 0 
    ? reasons.join("; ") + (insights.length > 0 ? ` | Also: ${insights.slice(0, 2).join("; ")}` : "")
    : `General match based on profile analysis`;
  
  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    categoryMatch,
    followerMatch,
    engagementMatch,
    locationMatch,
    budgetMatch,
    platformMatch,
    roiScore,
    reason,
    insights,
  };
}

export const matchRouter = createRouter({
  getCategories: publicQuery.query(() => CREATOR_CATEGORIES),

  createRequirement: authedQuery
    .input(
      z.object({
        campaignTitle: z.string().min(1),
        campaignDescription: z.string().optional(),
        contentTypes: z.array(z.string()).optional(),
        creatorCategories: z.array(z.string()).optional(),
        minFollowers: z.number().optional(),
        maxFollowers: z.number().optional(),
        minEngagementRate: z.number().optional(),
        preferredPlatforms: z.array(z.string()).optional(),
        budgetPerCreator: z.number().optional(),
        totalBudget: z.number().optional(),
        creatorsNeeded: z.number().default(1),
        minReachExpected: z.number().optional(),
        minLikesExpected: z.number().optional(),
        preferredLocation: z.string().optional(),
        campaignStart: z.string().optional(),
        campaignEnd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const data: Record<string, unknown> = {
        brandId: ctx.user.id,
        campaignTitle: input.campaignTitle,
        campaignDescription: input.campaignDescription,
        contentTypes: input.contentTypes,
        creatorCategories: input.creatorCategories,
        minFollowers: input.minFollowers,
        maxFollowers: input.maxFollowers,
        preferredPlatforms: input.preferredPlatforms,
        creatorsNeeded: input.creatorsNeeded,
        minReachExpected: input.minReachExpected,
        minLikesExpected: input.minLikesExpected,
        preferredLocation: input.preferredLocation,
        status: "matching",
      };
      if (input.minEngagementRate !== undefined) data.minEngagementRate = input.minEngagementRate.toString();
      if (input.budgetPerCreator !== undefined) data.budgetPerCreator = input.budgetPerCreator.toString();
      if (input.totalBudget !== undefined) data.totalBudget = input.totalBudget.toString();
      if (input.campaignStart) data.campaignStart = new Date(input.campaignStart);
      if (input.campaignEnd) data.campaignEnd = new Date(input.campaignEnd);

      const result = await db.insert(brandRequirements).values(data as typeof brandRequirements.$inferInsert).returning({ insertId: brandRequirements.id });
      return { success: true, requirementId: Number(result[0].insertId) };
    }),

  myRequirements: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const reqs = await db.select().from(brandRequirements).where(eq(brandRequirements.brandId, ctx.user.id)).orderBy(desc(brandRequirements.createdAt));
    return reqs;
  }),

  // ENHANCED AI MATCHING with learning
  runMatching: authedQuery
    .input(z.object({ requirementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const requirement = await db.query.brandRequirements.findFirst({ where: eq(brandRequirements.id, input.requirementId) });
      if (!requirement || requirement.brandId !== ctx.user.id) throw new Error("Requirement not found");

      // Get adaptive weights based on past outcomes
      const weights = await getAdaptiveWeights(db);
      
      // Get all available influencers
      const influencers = await db.select().from(influencerProfiles).where(eq(influencerProfiles.availableForCollaboration, true));
      
      // Calculate enhanced match scores
      const scoredMatches = await Promise.all(
        influencers.map(async (inf) => {
          const score = await calculateEnhancedMatchScore(requirement, inf, weights);
          return { influencer: inf, score };
        })
      );
      
      // Sort by score descending
      scoredMatches.sort((a, b) => b.score.totalScore - a.score.totalScore);
      
      // Take top matches (dynamic count based on requirement)
      const creatorsNeeded = requirement.creatorsNeeded ?? 1;
      const topCount = Math.max(10, creatorsNeeded * 5); // At least 5x the needed count
      const topMatches = scoredMatches.slice(0, topCount);

      // Clear existing matches
      await db.delete(aiMatches).where(eq(aiMatches.requirementId, input.requirementId));

      // Insert new matches
      for (const match of topMatches) {
        await db.insert(aiMatches).values({
          requirementId: input.requirementId,
          influencerId: match.influencer.userId,
          matchScore: match.score.totalScore,
          matchReason: match.score.reason,
          categoryMatch: match.score.categoryMatch,
          followerMatch: match.score.followerMatch,
          engagementMatch: match.score.engagementMatch,
          locationMatch: match.score.locationMatch,
          budgetMatch: match.score.budgetMatch,
          platformMatch: match.score.platformMatch,
        });
      }

      // Update requirement
      await db.update(brandRequirements).set({ autoMatched: true, updatedAt: new Date() }).where(eq(brandRequirements.id, input.requirementId));

      return {
        success: true,
        matchedCount: topMatches.length,
        weights: weights, // Return weights used (transparency)
        topMatches: topMatches.slice(0, 10).map((m) => ({
          influencerId: m.influencer.id,
          displayName: m.influencer.displayName,
          score: m.score.totalScore,
          reason: m.score.reason,
          insights: m.score.insights,
          roiScore: m.score.roiScore,
        })),
      };
    }),

  getMatches: authedQuery
    .input(z.object({ requirementId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const requirement = await db.query.brandRequirements.findFirst({ where: eq(brandRequirements.id, input.requirementId) });
      if (!requirement || requirement.brandId !== ctx.user.id) return [];
      
      const matches = await db.select().from(aiMatches).where(eq(aiMatches.requirementId, input.requirementId)).orderBy(desc(aiMatches.matchScore));
      const enriched = await Promise.all(matches.map(async (m) => {
        const influencer = await db.query.influencerProfiles.findFirst({ where: eq(influencerProfiles.id, m.influencerId) });
        return { ...m, influencer };
      }));
      return enriched;
    }),

  myMatches: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const matches = await db.select().from(aiMatches).where(eq(aiMatches.influencerId, ctx.user.id)).orderBy(desc(aiMatches.matchScore));
    const enriched = await Promise.all(matches.map(async (m) => {
      const requirement = await db.query.brandRequirements.findFirst({ where: eq(brandRequirements.id, m.requirementId) });
      return { ...m, requirement };
    }));
    return enriched;
  }),

  updateMatchStatus: authedQuery
    .input(z.object({ matchId: z.number(), status: z.enum(["suggested", "invited", "accepted", "declined"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(aiMatches).set({ status: input.status }).where(eq(aiMatches.id, input.matchId));
      return { success: true };
    }),
    
  // Get match insights (learning analytics)
  getInsights: authedQuery.query(async () => {
    const db = getDb();
    const totalMatches = await db.select({ count: sql<number>`count(*)` }).from(aiMatches);
    const accepted = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "accepted"));
    const declined = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "declined"));
    const invited = await db.select({ count: sql<number>`count(*)` }).from(aiMatches).where(eq(aiMatches.status, "invited"));
    
    // Average match scores
    const avgScore = await db.select({ avg: sql<number>`avg(${aiMatches.matchScore})` }).from(aiMatches);
    
    return {
      totalMatches: totalMatches[0]?.count ?? 0,
      accepted: accepted[0]?.count ?? 0,
      declined: declined[0]?.count ?? 0,
      invited: invited[0]?.count ?? 0,
      averageScore: Math.round(avgScore[0]?.avg ?? 0),
      acceptRate: totalMatches[0]?.count > 0 ? Math.round(((accepted[0]?.count ?? 0) / totalMatches[0].count) * 100) : 0,
    };
  }),
});
