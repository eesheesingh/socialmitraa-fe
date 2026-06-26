import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
  date,
  bigint,
} from "drizzle-orm/pg-core";

// ============ CORE USERS ============
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  // Set for email/password accounts; null for OAuth-only accounts
  passwordHash: text("passwordHash"),
  role: text("role", { enum: ["user", "brand", "influencer", "admin"] }).default("user").notNull(),
  onboardingComplete: boolean("onboardingComplete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ CREATOR / INFLUENCER PROFILES ============
export const influencerProfiles = pgTable("influencer_profiles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  // Basic Details
  fullName: varchar("fullName", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  bio: text("bio"),
  // Contact
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  // Social IDs
  instagramId: varchar("instagramId", { length: 100 }),
  facebookId: varchar("facebookId", { length: 100 }),
  youtubeId: varchar("youtubeId", { length: 100 }),
  tiktokId: varchar("tiktokId", { length: 100 }),
  twitterId: varchar("twitterId", { length: 100 }),
  linkedinId: varchar("linkedinId", { length: 100 }),
  // Creator Categories (multi-select stored as JSON array)
  categories: json("categories").$type<string[]>(),
  niche: varchar("niche", { length: 100 }),
  // Location
  location: varchar("location", { length: 100 }),
  city: varchar("city", { length: 100 }),
  // Audience
  followerCount: integer("followerCount").default(0),
  engagementRate: decimal("engagementRate", { precision: 5, scale: 2 }),
  avgLikes: integer("avgLikes").default(0),
  avgComments: integer("avgComments").default(0),
  avgReach: integer("avgReach").default(0),
  // Platforms active on
  platforms: json("platforms").$type<string[]>(),
  // Rate Card
  ratePerPost: decimal("ratePerPost", { precision: 10, scale: 2 }),
  ratePerStory: decimal("ratePerStory", { precision: 10, scale: 2 }),
  ratePerReel: decimal("ratePerReel", { precision: 10, scale: 2 }),
  ratePerVideo: decimal("ratePerVideo", { precision: 10, scale: 2 }),
  // Portfolio
  portfolioLinks: json("portfolioLinks").$type<string[]>(),
  sampleWork: text("sampleWork"),
  // Profile
  avatar: text("avatar"),
  verified: boolean("verified").default(false),
  availableForCollaboration: boolean("availableForCollaboration").default(true),
  // AI Matchmaking Score
  matchScore: integer("matchScore").default(0),
  // ─── Instagram Analytics (auto-fetched) ───
  igTotalFollowers: integer("igTotalFollowers").default(0),
  igTotalFollowing: integer("igTotalFollowing").default(0),
  igPostsCount: integer("igPostsCount").default(0),
  igAvgLikes: integer("igAvgLikes").default(0),
  igAvgComments: integer("igAvgComments").default(0),
  igEngagementRate: decimal("igEngagementRate", { precision: 5, scale: 2 }),
  igLikeEngagementRate: decimal("igLikeEngagementRate", { precision: 5, scale: 2 }),
  igCommentEngagementRate: decimal("igCommentEngagementRate", { precision: 5, scale: 2 }),
  igPostFrequency: decimal("igPostFrequency", { precision: 4, scale: 1 }),
  igTopHashtags: json("igTopHashtags").$type<string[]>(),
  igContentTypes: json("igContentTypes").$type<{ reel: number; post: number; carousel: number }>(),
  igFakeFollowerScore: integer("igFakeFollowerScore").default(0),
  igFakeFollowerPercentage: integer("igFakeFollowerPercentage").default(0),
  igFollowerQualityRating: varchar("igFollowerQualityRating", { length: 20 }),
  igEstimatedReach: integer("igEstimatedReach").default(0),
  igEstimatedImpressions: integer("igEstimatedImpressions").default(0),
  igAudienceActivity: varchar("igAudienceActivity", { length: 20 }),
  igOverallScore: integer("igOverallScore").default(0),
  igOverallRating: varchar("igOverallRating", { length: 20 }),
  igAnalyticsFetchedAt: timestamp("igAnalyticsFetchedAt"),
  igIsVerified: boolean("igIsVerified").default(false),
  igIsPrivate: boolean("igIsPrivate").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type InfluencerProfile = typeof influencerProfiles.$inferSelect;

// ============ BRAND PROFILES ============
export const brandProfiles = pgTable("brand_profiles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  // Basic Details
  companyName: varchar("companyName", { length: 255 }).notNull(),
  brandName: varchar("brandName", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  // Contact
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  // Location
  location: varchar("location", { length: 100 }),
  city: varchar("city", { length: 100 }),
  // Company Details
  teamSize: varchar("teamSize", { length: 50 }),
  budgetRange: varchar("budgetRange", { length: 50 }),
  logo: text("logo"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type BrandProfile = typeof brandProfiles.$inferSelect;

// ============ BRAND REQUIREMENTS (for AI Matchmaking) ============
export const brandRequirements = pgTable("brand_requirements", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  // Campaign Details
  campaignTitle: varchar("campaignTitle", { length: 255 }).notNull(),
  campaignDescription: text("campaignDescription"),
  // Content Type Required
  contentTypes: json("contentTypes").$type<string[]>(), // reel, post, story, video, photo
  // Influencer Requirements
  creatorCategories: json("creatorCategories").$type<string[]>(), // Fashion, Beauty, etc.
  minFollowers: integer("minFollowers"),
  maxFollowers: integer("maxFollowers"),
  minEngagementRate: decimal("minEngagementRate", { precision: 5, scale: 2 }),
  preferredPlatforms: json("preferredPlatforms").$type<string[]>(),
  // Budget & Payment
  budgetPerCreator: decimal("budgetPerCreator", { precision: 12, scale: 2 }),
  totalBudget: decimal("totalBudget", { precision: 12, scale: 2 }),
  creatorsNeeded: integer("creatorsNeeded").default(1),
  // Reach & Performance expectations
  minReachExpected: integer("minReachExpected"),
  minLikesExpected: integer("minLikesExpected"),
  // Location preference
  preferredLocation: varchar("preferredLocation", { length: 100 }),
  // Campaign Timeline
  campaignStart: date("campaignStart", { mode: "date" }),
  campaignEnd: date("campaignEnd", { mode: "date" }),
  // Status
  status: text("status", { enum: ["draft", "matching", "active", "completed", "cancelled"] }).default("draft"),
  // AI Match Results
  autoMatched: boolean("autoMatched").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type BrandRequirement = typeof brandRequirements.$inferSelect;

// ============ AI MATCHES ============
export const aiMatches = pgTable("ai_matches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  requirementId: bigint("requirementId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  // AI Score (0-100)
  matchScore: integer("matchScore").notNull(),
  // Match Reason
  matchReason: text("matchReason"),
  // Factors
  categoryMatch: integer("categoryMatch").default(0), // 0-100
  followerMatch: integer("followerMatch").default(0),
  engagementMatch: integer("engagementMatch").default(0),
  locationMatch: integer("locationMatch").default(0),
  budgetMatch: integer("budgetMatch").default(0),
  platformMatch: integer("platformMatch").default(0),
  // Status
  status: text("status", { enum: ["suggested", "invited", "accepted", "declined"] }).default("suggested"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMatch = typeof aiMatches.$inferSelect;

// ============ CAMPAIGNS ============
export const campaigns = pgTable("campaigns", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  requirementId: bigint("requirementId", { mode: "number" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requirements: text("requirements"),
  platform: text("platform", { enum: ["instagram", "youtube", "tiktok", "all"] }).default("all"),
  contentType: text("contentType", { enum: ["post", "story", "reel", "all"] }).default("all"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  creatorCount: integer("creatorCount").default(1),
  niche: varchar("niche", { length: 100 }),
  location: varchar("location", { length: 100 }),
  followerMin: integer("followerMin"),
  followerMax: integer("followerMax"),
  status: text("status", { enum: ["draft", "active", "paused", "completed", "cancelled"] }).default("draft"),
  startDate: date("startDate", { mode: "date" }),
  endDate: date("endDate", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ============ CAMPAIGN APPLICATIONS ============
export const campaignApplications = pgTable("campaign_applications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  message: text("message"),
  proposedRate: decimal("proposedRate", { precision: 10, scale: 2 }),
  status: text("status", { enum: ["pending", "accepted", "rejected", "completed"] }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ============ PAYMENTS ============
export const payments = pgTable("payments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal("gstAmount", { precision: 10, scale: 2 }).default("0"),
  gstRate: decimal("gstRate", { precision: 5, scale: 2 }).default("18"),
  currency: varchar("currency", { length: 10 }).default("INR"),
  // Payment Gateway
  gateway: varchar("gateway", { length: 50 }).default("razorpay"),
  gatewayPaymentId: varchar("gatewayPaymentId", { length: 255 }),
  gatewayStatus: text("gatewayStatus", { enum: ["pending", "processing", "completed", "failed", "refunded"] }).default("pending"),
  // Status
  status: text("status", { enum: ["pending", "escrow", "released", "refunded"] }).default("pending"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;

// ============ BARTER DEALS ============
export const barterDeals = pgTable("barter_deals", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  // What the brand is offering
  productName: varchar("productName", { length: 255 }).notNull(),
  productDescription: text("productDescription"),
  productValue: decimal("productValue", { precision: 10, scale: 2 }), // approximate value
  productImage: text("productImage"),
  // What the brand wants in return
  contentType: json("contentType").$type<string[]>(), // reel, post, story, video
  deliverables: text("deliverables"), // e.g., "1 Instagram Reel + 2 Stories"
  // Influencer requirements
  creatorCategories: json("creatorCategories").$type<string[]>(),
  minFollowers: integer("minFollowers"),
  maxFollowers: integer("maxFollowers"),
  minEngagementRate: decimal("minEngagementRate", { precision: 5, scale: 2 }),
  preferredPlatforms: json("preferredPlatforms").$type<string[]>(),
  preferredLocation: varchar("preferredLocation", { length: 100 }),
  // Campaign details
  campaignStart: date("campaignStart", { mode: "date" }),
  campaignEnd: date("campaignEnd", { mode: "date" }),
  instructions: text("instructions"), // specific instructions for creators
  // Status
  status: text("status", { enum: ["open", "closed", "in_progress", "completed"] }).default("open"),
  slotsTotal: integer("slotsTotal").default(1),
  slotsFilled: integer("slotsFilled").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type BarterDeal = typeof barterDeals.$inferSelect;

// ============ BARTER APPLICATIONS ============
export const barterApplications = pgTable("barter_applications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  dealId: bigint("dealId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  // Application details
  message: text("message"), // why they want this barter
  proposedDeliverables: text("proposedDeliverables"), // what they'll create
  // Content submission (after approval)
  contentLinks: json("contentLinks").$type<string[]>(), // links to published content
  contentSubmittedAt: timestamp("contentSubmittedAt"),
  // Status
  status: text("status", { enum: ["applied", "shortlisted", "approved", "content_submitted", "completed", "rejected"] }).default("applied"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type BarterApplication = typeof barterApplications.$inferSelect;

// ============ USER CONSENTS (T&C) ============
export const userConsents = pgTable("user_consents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull().unique(),
  termsAccepted: boolean("termsAccepted").default(false),
  privacyAccepted: boolean("privacyAccepted").default(false),
  cookiesAccepted: boolean("cookiesAccepted").default(false),
  marketingAccepted: boolean("marketingAccepted").default(false),
  ipAddress: varchar("ipAddress", { length: 100 }),
  userAgent: text("userAgent"),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type UserConsent = typeof userConsents.$inferSelect;

// ============ NOTIFICATIONS ============
export const notifications = pgTable("notifications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: text("type", { enum: [
    "info", "success", "warning", "campaign", "payment", "match",
    "payment_failed", "payment_reminder", "subscription_downgraded",
    "campaign_approved", "campaign_rejected", "new_match",
    "negotiation_update", "payout_released", "system_alert",
  ] }).default("info"),
  read: boolean("read").default(false),
  isRead: boolean("isRead").default(false),
  actionUrl: varchar("actionUrl", { length: 500 }),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============ CREATOR MEDIA KITS ============
export const mediaKits = pgTable("media_kits", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull().unique(),
  headline: varchar("headline", { length: 255 }),
  about: text("about"),
  achievements: json("achievements").$type<string[]>(),
  totalCollaborations: integer("totalCollaborations").default(0),
  totalBrandsWorkedWith: integer("totalBrandsWorkedWith").default(0),
  featuredWorks: json("featuredWorks").$type<{ title: string; url: string; type: string; brandName: string }[]>(),
  testimonials: json("testimonials").$type<{ brandName: string; quote: string; rating: number }[]>(),
  isPublic: boolean("isPublic").default(true),
  vanityUrl: varchar("vanityUrl", { length: 100 }).unique(),
  viewCount: integer("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type MediaKit = typeof mediaKits.$inferSelect;

// ============ CAMPAIGN TRACKING (ROI) ============
export const campaignTracking = pgTable("campaign_tracking", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }).notNull(),
  applicationId: bigint("applicationId", { mode: "number" }).notNull(),
  trackingUrl: varchar("trackingUrl", { length: 500 }).notNull(),
  shortCode: varchar("shortCode", { length: 20 }).notNull().unique(),
  clicks: integer("clicks").default(0),
  uniqueClicks: integer("uniqueClicks").default(0),
  impressions: integer("impressions").default(0),
  conversions: integer("conversions").default(0),
  revenueGenerated: decimal("revenueGenerated", { precision: 12, scale: 2 }).default("0"),
  status: text("status", { enum: ["active", "paused", "completed"] }).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CampaignTracking = typeof campaignTracking.$inferSelect;

// ============ CAMPAIGN ANALYTICS (Aggregated ROI) ============
export const campaignAnalytics = pgTable("campaign_analytics", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }).notNull().unique(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  totalSpend: decimal("totalSpend", { precision: 12, scale: 2 }).default("0"),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  totalClicks: integer("totalClicks").default(0),
  totalConversions: integer("totalConversions").default(0),
  totalImpressions: integer("totalImpressions").default(0),
  roi: decimal("roi", { precision: 8, scale: 2 }).default("0"),
  cpc: decimal("cpc", { precision: 10, scale: 2 }).default("0"),
  cpa: decimal("cpa", { precision: 10, scale: 2 }).default("0"),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0"),
  startDate: timestamp("startDate").defaultNow(),
  endDate: timestamp("endDate"),
  reportGenerated: boolean("reportGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CampaignAnalytics = typeof campaignAnalytics.$inferSelect;

// ============ AFFILIATE PROGRAMS ============
export const affiliatePrograms = pgTable("affiliate_programs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  programName: varchar("programName", { length: 255 }).notNull(),
  description: text("description"),
  commissionType: text("commissionType", { enum: ["percentage", "fixed"] }).default("percentage"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).default("0"),
  productName: varchar("productName", { length: 255 }),
  productValue: decimal("productValue", { precision: 10, scale: 2 }),
  productUrl: text("productUrl"),
  cookieDuration: integer("cookieDuration").default(30),
  minFollowers: integer("minFollowers").default(0),
  creatorCategories: json("creatorCategories").$type<string[]>(),
  status: text("status", { enum: ["active", "paused", "ended"] }).default("active"),
  totalCreatorsJoined: integer("totalCreatorsJoined").default(0),
  totalClicks: integer("totalClicks").default(0),
  totalConversions: integer("totalConversions").default(0),
  totalCommissionPaid: decimal("totalCommissionPaid", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type AffiliateProgram = typeof affiliatePrograms.$inferSelect;

// ============ AFFILIATE LINKS ============
export const affiliateLinks = pgTable("affiliate_links", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  programId: bigint("programId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  uniqueCode: varchar("uniqueCode", { length: 20 }).notNull().unique(),
  uniqueUrl: text("uniqueUrl"),
  clicks: integer("clicks").default(0),
  uniqueClicks: integer("uniqueClicks").default(0),
  conversions: integer("conversions").default(0),
  commissionEarned: decimal("commissionEarned", { precision: 12, scale: 2 }).default("0"),
  status: text("status", { enum: ["active", "paused", "removed"] }).default("active"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type AffiliateLink = typeof affiliateLinks.$inferSelect;

// ============ AFFILIATE CONVERSIONS ============
export const affiliateConversions = pgTable("affiliate_conversions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  linkId: bigint("linkId", { mode: "number" }).notNull(),
  programId: bigint("programId", { mode: "number" }).notNull(),
  orderId: varchar("orderId", { length: 100 }),
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "paid"] }).default("pending"),
  customerIp: varchar("customerIp", { length: 100 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type AffiliateConversion = typeof affiliateConversions.$inferSelect;

// ============ PLATFORM CONFIG (Pricing & Commission) ============
export const platformConfig = pgTable("platform_config", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;

// ============ BRAND SUBSCRIPTIONS ============
export const brandSubscriptions = pgTable("brand_subscriptions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  brandId: bigint("brandId", { mode: "number" }).notNull().unique(),
  plan: text("plan", { enum: ["free", "growth", "pro", "enterprise"] }).default("free").notNull(),
  // Pricing
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).default("0"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("15"), // %
  // Feature flags
  maxActiveCampaigns: integer("maxActiveCampaigns").default(1),
  canUseAiMatching: boolean("canUseAiMatching").default(false),
  canUseRoiTracking: boolean("canUseRoiTracking").default(false),
  canUseAffiliate: boolean("canUseAffiliate").default(false),
  canFeatureCampaigns: boolean("canFeatureCampaigns").default(false),
  // Status
  status: text("status", { enum: ["active", "cancelled", "expired", "trial"] }).default("trial"),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  // Tracking
  totalDealsClosed: integer("totalDealsClosed").default(0),
  totalCommissionPaid: decimal("totalCommissionPaid", { precision: 12, scale: 2 }).default("0"),
  totalSubscriptionPaid: decimal("totalSubscriptionPaid", { precision: 12, scale: 2 }).default("0"),
  // Auto-payment tracking
  paymentMethodId: varchar("paymentMethodId", { length: 255 }),
  lastPaymentDate: timestamp("lastPaymentDate"),
  lastPaymentStatus: text("lastPaymentStatus", { enum: ["success", "failed", "pending", "none"] }).default("none"),
  failedPaymentCount: integer("failedPaymentCount").default(0),
  gracePeriodEndsAt: timestamp("gracePeriodEndsAt"),
  reminderSentAt: timestamp("reminderSentAt"),
  downgradeScheduledAt: timestamp("downgradeScheduledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type BrandSubscription = typeof brandSubscriptions.$inferSelect;

// ============ CREATOR SUBSCRIPTIONS ============
export const creatorSubscriptions = pgTable("creator_subscriptions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  creatorId: bigint("creatorId", { mode: "number" }).notNull().unique(),
  plan: text("plan", { enum: ["free", "verified", "pro"] }).default("free").notNull(),
  // Pricing
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).default("0"),
  // Feature flags
  hasVerifiedBadge: boolean("hasVerifiedBadge").default(false),
  hasMediaKit: boolean("hasMediaKit").default(false),
  canGetFeatured: boolean("canGetFeatured").default(false),
  canGetPriorityMatching: boolean("canGetPriorityMatching").default(false),
  canGetTaxInvoices: boolean("canGetTaxInvoices").default(false),
  earlyAccessCampaigns: boolean("earlyAccessCampaigns").default(false),
  // Status
  status: text("status", { enum: ["active", "cancelled", "expired", "trial"] }).default("trial"),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  // Tracking
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0"),
  totalSubscriptionPaid: decimal("totalSubscriptionPaid", { precision: 12, scale: 2 }).default("0"),
  // Auto-payment tracking
  paymentMethodId: varchar("paymentMethodId", { length: 255 }),
  lastPaymentDate: timestamp("lastPaymentDate"),
  lastPaymentStatus: text("lastPaymentStatus", { enum: ["success", "failed", "pending", "none"] }).default("none"),
  failedPaymentCount: integer("failedPaymentCount").default(0),
  gracePeriodEndsAt: timestamp("gracePeriodEndsAt"),
  reminderSentAt: timestamp("reminderSentAt"),
  downgradeScheduledAt: timestamp("downgradeScheduledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CreatorSubscription = typeof creatorSubscriptions.$inferSelect;

// ============ PLATFORM FEES (Commission Log) ============
export const platformFees = pgTable("platform_fees", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // Who was charged
  payerUserId: bigint("payerUserId", { mode: "number" }).notNull(),
  payerType: text("payerType", { enum: ["brand", "influencer"] }).notNull(),
  // Related entity
  campaignId: bigint("campaignId", { mode: "number" }),
  paymentId: bigint("paymentId", { mode: "number" }),
  // Fee details
  feeType: text("feeType", { enum: [
    "commission_deal",
    "brand_subscription",
    "creator_subscription",
    "barter_listing",
    "affiliate_override",
    "featured_campaign",
    "instant_payout",
    "verification_badge",
  ] }).notNull(),
  baseAmount: decimal("baseAmount", { precision: 12, scale: 2 }).notNull(), // original amount
  feeRate: decimal("feeRate", { precision: 5, scale: 2 }).default("0"), // percentage rate
  feeAmount: decimal("feeAmount", { precision: 12, scale: 2 }).notNull(), // what we charged
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(), // what creator/brand gets
  // Description
  description: varchar("description", { length: 255 }),
  // Security
  ipAddress: varchar("ipAddress", { length: 100 }),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});

export type PlatformFee = typeof platformFees.$inferSelect;

// ============ FEATURED CAMPAIGNS ============
export const featuredCampaigns = pgTable("featured_campaigns", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }).notNull(),
  barterDealId: bigint("barterDealId", { mode: "number" }),
  // Feature details
  featureType: text("featureType", { enum: ["home_hero", "top_of_feed", "email_blast", "push_notification", "urgent_badge"] }).notNull(),
  durationDays: integer("durationDays").default(7),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }).notNull(),
  // Status
  status: text("status", { enum: ["active", "expired", "cancelled"] }).default("active"),
  featuredAt: timestamp("featuredAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  // Performance
  impressionsGenerated: integer("impressionsGenerated").default(0),
  clicksGenerated: integer("clicksGenerated").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeaturedCampaign = typeof featuredCampaigns.$inferSelect;

// ============ PROMOTIONS (Phase Campaigns) ============
export const promotions = pgTable("promotions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // What it affects
  promotionType: text("promotionType", { enum: [
    "zero_commission",
    "free_subscription",
    "discounted_commission",
    "free_verified",
    "free_featured",
  ] }).notNull(),
  // Value
  discountValue: decimal("discountValue", { precision: 5, scale: 2 }).default("0"), // percentage off
  maxUses: integer("maxUses").default(0), // 0 = unlimited
  currentUses: integer("currentUses").default(0),
  // Limits
  maxDealsPerUser: integer("maxDealsPerUser").default(0), // 0 = unlimited
  minSpend: decimal("minSpend", { precision: 10, scale: 2 }).default("0"),
  // Eligibility
  eligibleUserType: text("eligibleUserType", { enum: ["brand", "influencer", "all"] }).default("all"),
  // Status
  status: text("status", { enum: ["active", "paused", "expired"] }).default("active"),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;

// ============ USER PROMOTION USAGE ============
export const userPromotionUsage = pgTable("user_promotion_usage", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  promotionId: bigint("promotionId", { mode: "number" }).notNull(),
  usageCount: integer("usageCount").default(1),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
});

// ============ CREATOR CREDIT SCORES ============
export const creditScores = pgTable("credit_scores", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  creatorId: bigint("creatorId", { mode: "number" }).notNull().unique(),
  // Core Score (0-900, like CIBIL)
  overallScore: integer("overallScore").default(0),
  scoreCategory: text("scoreCategory", { enum: ["excellent", "good", "average", "poor", "risk"] }).default("poor"),
  // Component Scores (each 0-100)
  contentConsistencyScore: integer("contentConsistencyScore").default(0),
  brandReliabilityScore: integer("brandReliabilityScore").default(0),
  audienceQualityScore: integer("audienceQualityScore").default(0),
  engagementAuthenticityScore: integer("engagementAuthenticityScore").default(0),
  financialReliabilityScore: integer("financialReliabilityScore").default(0),
  complianceScore: integer("complianceScore").default(0),
  growthVelocityScore: integer("growthVelocityScore").default(0),
  platformDiversityScore: integer("platformDiversityScore").default(0),
  // Factors that influenced score
  positiveFactors: json("positiveFactors").$type<string[]>(),
  negativeFactors: json("negativeFactors").$type<string[]>(),
  improvementTips: json("improvementTips").$type<string[]>(),
  // History
  previousScore: integer("previousScore").default(0),
  scoreChange: integer("scoreChange").default(0),
  // Public report
  reportGenerated: boolean("reportGenerated").default(false),
  reportUrl: text("reportUrl"),
  // Timestamps
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  nextCalculationAt: timestamp("nextCalculationAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CreditScore = typeof creditScores.$inferSelect;

// ============ NEGOTIATION SESSIONS ============
export const negotiationSessions = pgTable("negotiation_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  campaignId: bigint("campaignId", { mode: "number" }).notNull(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
  influencerId: bigint("influencerId", { mode: "number" }).notNull(),
  // Brand side
  brandBudgetMin: decimal("brandBudgetMin", { precision: 10, scale: 2 }).notNull(),
  brandBudgetMax: decimal("brandBudgetMax", { precision: 10, scale: 2 }).notNull(),
  brandDeliverables: json("brandDeliverables").$type<string[]>(),
  brandUrgency: text("brandUrgency", { enum: ["low", "medium", "high"] }).default("medium"),
  // Creator side
  creatorAskingRate: decimal("creatorAskingRate", { precision: 10, scale: 2 }).notNull(),
 creatorMinimumRate: decimal("creatorMinimumRate", { precision: 10, scale: 2 }),
  creatorAvailability: text("creatorAvailability", { enum: ["immediate", "1week", "2weeks", "1month"] }).default("1week"),
  // AI negotiation
  aiSuggestedRate: decimal("aiSuggestedRate", { precision: 10, scale: 2 }),
  aiReasoning: text("aiReasoning"),
  marketBenchmarkRate: decimal("marketBenchmarkRate", { precision: 10, scale: 2 }),
  // Status
  status: text("status", { enum: ["pending", "ai_negotiating", "brand_accepted", "creator_accepted", "both_accepted", "expired", "rejected"] }).default("pending"),
  // Final
  agreedRate: decimal("agreedRate", { precision: 10, scale: 2 }),
  agreedDeliverables: json("agreedDeliverables").$type<string[]>(),
  // Messages
  messages: json("messages").$type<{ sender: string; message: string; timestamp: string }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  expiresAt: timestamp("expiresAt"),
});

export type NegotiationSession = typeof negotiationSessions.$inferSelect;

// ============ REGIONAL LANGUAGE PREFERENCES ============
export const languagePreferences = pgTable("language_preferences", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  creatorId: bigint("creatorId", { mode: "number" }).notNull().unique(),
  // Languages (creator can select multiple)
  primaryLanguage: varchar("primaryLanguage", { length: 50 }).default("hindi"),
  secondaryLanguages: json("secondaryLanguages").$type<string[]>(),
  // Content language
  contentLanguage: varchar("contentLanguage", { length: 50 }).default("hindi"),
  // Region
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  tier: text("tier", { enum: ["tier1", "tier2", "tier3", "rural"] }).default("tier2"),
  // Vernacular specialties
  vernacularNiches: json("vernacularNiches").$type<string[]>(), // e.g., ["bhojpuri_comedy", "tamil_food"]
  // Regional festivals/content opportunities
  upcomingFestivals: json("upcomingFestivals").$type<string[]>(),
  // Discovery
  isVernacularCreator: boolean("isVernacularCreator").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type LanguagePreference = typeof languagePreferences.$inferSelect;

// ============ REGIONAL TRENDS ============
export const regionalTrends = pgTable("regional_trends", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // Trend info
  trendName: varchar("trendName", { length: 255 }).notNull(),
  trendDescription: text("trendDescription"),
  category: varchar("category", { length: 100 }), // fashion, food, tech, etc.
  // Language/region
  language: varchar("language", { length: 50 }).notNull(),
  region: varchar("region", { length: 100 }),
  // Metrics
  searchVolumeGrowth: decimal("searchVolumeGrowth", { precision: 8, scale: 2 }).default("0"), // percentage
  engagementGrowth: decimal("engagementGrowth", { precision: 8, scale: 2 }).default("0"),
  creatorCount: integer("creatorCount").default(0),
  // Timing
  predictedPeakDate: timestamp("predictedPeakDate"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"), // 0-100
  // Status
  status: text("status", { enum: ["emerging", "rising", "peaking", "declining"] }).default("emerging"),
  // Content suggestions
  contentSuggestions: json("contentSuggestions").$type<string[]>(),
  suggestedHashtags: json("suggestedHashtags").$type<string[]>(),
  // Source
  source: varchar("source", { length: 100 }), // google_trends, twitter, manual
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type RegionalTrend = typeof regionalTrends.$inferSelect;

// ============ PLATFORM ANALYTICS (Monthly Snapshots) ============
export const platformAnalytics = pgTable("platform_analytics", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  snapshotDate: date("snapshotDate", { mode: "date" }).notNull(),
  snapshotMonth: varchar("snapshotMonth", { length: 7 }).notNull(), // YYYY-MM
  // User metrics
  totalUsers: integer("totalUsers").default(0),
  newUsers: integer("newUsers").default(0),
  newBrands: integer("newBrands").default(0),
  newInfluencers: integer("newInfluencers").default(0),
  activeUsers: integer("activeUsers").default(0),
  // Revenue metrics
  totalRevenue: decimal("totalRevenue", { precision: 14, scale: 2 }).default("0"),
  subscriptionRevenue: decimal("subscriptionRevenue", { precision: 14, scale: 2 }).default("0"),
  commissionRevenue: decimal("commissionRevenue", { precision: 14, scale: 2 }).default("0"),
  featuredRevenue: decimal("featuredRevenue", { precision: 14, scale: 2 }).default("0"),
  gstCollected: decimal("gstCollected", { precision: 14, scale: 2 }).default("0"),
  // Transaction metrics
  totalPayments: integer("totalPayments").default(0),
  totalInEscrow: integer("totalInEscrow").default(0),
  totalReleased: integer("totalReleased").default(0),
  totalRefunded: integer("totalRefunded").default(0),
  // Campaign metrics
  totalCampaigns: integer("totalCampaigns").default(0),
  activeCampaigns: integer("activeCampaigns").default(0),
  completedCampaigns: integer("completedCampaigns").default(0),
  totalApplications: integer("totalApplications").default(0),
  // Subscription metrics
  activeBrandSubs: integer("activeBrandSubs").default(0),
  activeCreatorSubs: integer("activeCreatorSubs").default(0),
  failedPayments: integer("failedPayments").default(0),
  churnedUsers: integer("churnedUsers").default(0),
  // MoM growth
  userGrowthRate: decimal("userGrowthRate", { precision: 6, scale: 2 }).default("0"),
  revenueGrowthRate: decimal("revenueGrowthRate", { precision: 6, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlatformAnalytic = typeof platformAnalytics.$inferSelect;