import { z } from "zod";
import { createRouter, authedQuery, influencerQuery, brandQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { languagePreferences, regionalTrends, influencerProfiles, users } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── Regional Language Index Router ───
// Powers the world's first vernacular creator discovery system

const INDIAN_LANGUAGES = [
  "hindi", "tamil", "telugu", "marathi", "gujarati",
  "bengali", "kannada", "malayalam", "punjabi", "urdu",
  "odia", "assamese", "english", "hinglish"
] as const;

const INDIAN_STATES = [
  "andhra_pradesh", "arunachal_pradesh", "assam", "bihar", "chhattisgarh",
  "goa", "gujarat", "haryana", "himachal_pradesh", "jharkhand",
  "karnataka", "kerala", "madhya_pradesh", "maharashtra", "manipur",
  "meghalaya", "mizoram", "nagaland", "odisha", "punjab",
  "rajasthan", "sikkim", "tamil_nadu", "telangana", "tripura",
  "uttar_pradesh", "uttarakhand", "west_bengal", "delhi", "jammu_kashmir"
] as const;

const TIER_CITIES: Record<string, string[]> = {
  tier1: ["delhi", "mumbai", "bangalore", "hyderabad", "chennai", "kolkata", "pune"],
  tier2: ["jaipur", "lucknow", "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam", "vadodara", "firozabad"],
  tier3: ["auli", "pushkar", "mcleodganj", "hampi", "pondicherry", "kasol", "munnar", "goa"],
};

export const regionalRouter = createRouter({
  // ─── Creator: Set language preferences ───
  setPreferences: influencerQuery
    .input(z.object({
      primaryLanguage: z.enum(INDIAN_LANGUAGES as any),
      secondaryLanguages: z.array(z.enum(INDIAN_LANGUAGES as any)).optional(),
      contentLanguage: z.enum(INDIAN_LANGUAGES as any).optional(),
      state: z.enum(INDIAN_STATES as any).optional(),
      city: z.string().max(100).optional(),
      tier: z.enum(["tier1", "tier2", "tier3", "rural"]).optional(),
      vernacularNiches: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const creatorId = ctx.user.id;

      const [existing] = await db
        .select()
        .from(languagePreferences)
        .where(eq(languagePreferences.creatorId, creatorId));

      const isVernacular = input.primaryLanguage !== "english" || (input.secondaryLanguages?.some((l: string) => l !== "english") ?? false);

      const data = {
        ...input,
        isVernacularCreator: isVernacular,
        secondaryLanguages: input.secondaryLanguages ?? [],
        vernacularNiches: input.vernacularNiches ?? [],
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(languagePreferences)
          .set(data)
          .where(eq(languagePreferences.creatorId, creatorId));
      } else {
        await db.insert(languagePreferences).values({
          creatorId,
          ...data,
          createdAt: new Date(),
        } as any);
      }

      return { success: true, isVernacular };
    }),

  // ─── Creator: Get my language preferences ───
  myPreferences: influencerQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [prefs] = await db
      .select()
      .from(languagePreferences)
      .where(eq(languagePreferences.creatorId, ctx.user.id));
    return prefs ?? null;
  }),

  // ─── Brand: Discover creators by language ───
  discoverByLanguage: brandQuery
    .input(z.object({
      language: z.enum(INDIAN_LANGUAGES as any),
      region: z.enum(INDIAN_STATES as any).optional(),
      tier: z.enum(["tier1", "tier2", "tier3", "rural"]).optional(),
      niche: z.string().optional(),
      minFollowers: z.number().optional(),
      maxFollowers: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      // Build conditions
      const conditions = [eq(languagePreferences.isVernacularCreator, true)];

      if (input.language) {
        conditions.push(
          sql`(${languagePreferences.primaryLanguage} = ${input.language} OR JSON_CONTAINS(${languagePreferences.secondaryLanguages}, JSON_QUOTE(${input.language})))`
        );
      }
      if (input.region) {
        conditions.push(eq(languagePreferences.state, input.region));
      }
      if (input.tier) {
        conditions.push(eq(languagePreferences.tier, input.tier));
      }

      // Get creators with language prefs + profile data
      const creators = await db
        .select({
          pref: languagePreferences,
          profile: influencerProfiles,
          user: users,
        })
        .from(languagePreferences)
        .innerJoin(influencerProfiles, eq(languagePreferences.creatorId, influencerProfiles.userId))
        .innerJoin(users, eq(languagePreferences.creatorId, users.id))
        .where(and(...conditions))
        .orderBy(desc(influencerProfiles.igTotalFollowers))
        .limit(input.limit)
        .offset(offset);

      // Filter by followers if specified
      let filtered = creators;
      if (input.minFollowers) {
        filtered = filtered.filter(c => (c.profile.igTotalFollowers ?? 0) >= input.minFollowers!);
      }
      if (input.maxFollowers) {
        filtered = filtered.filter(c => (c.profile.igTotalFollowers ?? 0) <= input.maxFollowers!);
      }
      if (input.niche) {
        filtered = filtered.filter(c => {
          const niches = c.profile.categories as string[] ?? [];
          return niches.some((n: string) => n.toLowerCase().includes(input.niche!.toLowerCase()));
        });
      }

      return filtered.map(c => ({
        id: c.profile.userId,
        name: c.user.name ?? c.profile.displayName ?? "Unknown",
        avatar: c.user.avatar,
        primaryLanguage: c.pref.primaryLanguage,
        secondaryLanguages: c.pref.secondaryLanguages,
        state: c.pref.state,
        city: c.pref.city,
        tier: c.pref.tier,
        niche: c.profile.niche,
        categories: c.profile.categories,
        followerCount: c.profile.igTotalFollowers ?? c.profile.followerCount ?? 0,
        engagementRate: c.profile.igEngagementRate ?? c.profile.engagementRate,
        ratePerPost: c.profile.ratePerPost,
        bio: c.profile.bio,
        vernacularNiches: c.pref.vernacularNiches,
      }));
    }),

  // ─── Get all supported languages ───
  getLanguages: publicQuery.query(() => {
    return INDIAN_LANGUAGES.map(lang => ({
      code: lang,
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      nativeName: getNativeName(lang),
    }));
  }),

  // ─── Get all Indian states ───
  getStates: publicQuery.query(() => {
    return INDIAN_STATES.map(state => ({
      code: state,
      name: state.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    }));
  }),

  // ─── Get regional trends ───
  getTrends: publicQuery
    .input(z.object({
      language: z.enum(INDIAN_LANGUAGES as any).optional(),
      region: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(["emerging", "rising", "peaking", "declining"]).optional(),
      limit: z.number().default(10),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.language) conditions.push(eq(regionalTrends.language, input.language));
      if (input?.region) conditions.push(eq(regionalTrends.region, input.region));
      if (input?.category) conditions.push(eq(regionalTrends.category, input.category));
      if (input?.status) conditions.push(eq(regionalTrends.status, input.status));

      const query = conditions.length > 0
        ? db.select().from(regionalTrends).where(and(...conditions)).orderBy(desc(regionalTrends.searchVolumeGrowth)).limit(input?.limit ?? 10)
        : db.select().from(regionalTrends).orderBy(desc(regionalTrends.searchVolumeGrowth)).limit(input?.limit ?? 10);

      return await query;
    }),

  // ─── Get language market insights ───
  languageInsights: publicQuery.query(async () => {
    const db = getDb();

    // Count creators per language
    const langCounts = await db
      .select({
        language: languagePreferences.primaryLanguage,
        count: sql<number>`COUNT(*)`,
      })
      .from(languagePreferences)
      .groupBy(languagePreferences.primaryLanguage);

    // Count vernacular vs non-vernacular
    const vernacularCounts = await db
      .select({
        isVernacular: languagePreferences.isVernacularCreator,
        count: sql<number>`COUNT(*)`,
      })
      .from(languagePreferences)
      .groupBy(languagePreferences.isVernacularCreator);

    return {
      creatorsByLanguage: langCounts,
      vernacularBreakdown: vernacularCounts,
      totalLanguages: INDIAN_LANGUAGES.length,
      tierCoverage: Object.keys(TIER_CITIES).length,
    };
  }),

  // ─── Admin/Auto: Create regional trend ───
  createTrend: authedQuery
    .input(z.object({
      trendName: z.string().min(1),
      trendDescription: z.string().optional(),
      category: z.string().optional(),
      language: z.enum(INDIAN_LANGUAGES as any),
      region: z.string().optional(),
      searchVolumeGrowth: z.number().optional(),
      engagementGrowth: z.number().optional(),
      creatorCount: z.number().optional(),
      predictedPeakDate: z.string().optional(),
      confidence: z.number().optional(),
      status: z.enum(["emerging", "rising", "peaking", "declining"]).optional(),
      contentSuggestions: z.array(z.string()).optional(),
      suggestedHashtags: z.array(z.string()).optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = getDb();

      const result = await db.insert(regionalTrends).values({
        ...input,
        predictedPeakDate: input.predictedPeakDate ? new Date(input.predictedPeakDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ insertId: regionalTrends.id });

      return { success: true, trendId: Number(result[0].insertId) };
    }),

  // ─── Get vernacular creator stats ───
  vernacularStats: publicQuery.query(async () => {
    const db = getDb();

    const totalVernacular = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(languagePreferences)
      .where(eq(languagePreferences.isVernacularCreator, true));

    const topLanguages = await db
      .select({
        language: languagePreferences.primaryLanguage,
        count: sql<number>`COUNT(*)`,
      })
      .from(languagePreferences)
      .where(eq(languagePreferences.isVernacularCreator, true))
      .groupBy(languagePreferences.primaryLanguage)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const tierDistribution = await db
      .select({
        tier: languagePreferences.tier,
        count: sql<number>`COUNT(*)`,
      })
      .from(languagePreferences)
      .groupBy(languagePreferences.tier);

    return {
      totalVernacularCreators: totalVernacular[0]?.count ?? 0,
      topLanguages,
      tierDistribution,
      languagesSupported: INDIAN_LANGUAGES.length,
    };
  }),
});

function getNativeName(lang: string): string {
  const map: Record<string, string> = {
    hindi: "हिन्दी", tamil: "தமிழ்", telugu: "తెలుగు",
    marathi: "मराठी", gujarati: "ગુજરાતી", bengali: "বাংলা",
    kannada: "ಕನ್ನಡ", malayalam: "മലയാളം", punjabi: "ਪੰਜਾਬੀ",
    urdu: "اردو", odia: "ଓଡ଼ିଆ", assamese: "অসমীয়া",
    english: "English", hinglish: "Hinglish",
  };
  return map[lang] ?? lang;
}
