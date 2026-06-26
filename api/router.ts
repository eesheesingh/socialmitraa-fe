import { authRouter } from "./auth-router";
import { brandRouter } from "./brand-router";
import { influencerRouter } from "./influencer-router";
import { campaignRouter } from "./campaign-router";
import { adminRouter } from "./admin-router";
import { matchRouter } from "./match-router";
import { paymentRouter } from "./payment-router";
import { barterRouter } from "./barter-router";
import { consentRouter } from "./consent-router";
import { instagramRouter } from "./instagram-router";
import { mediaKitRouter } from "./media-kit-router";
import { roiRouter } from "./roi-router";
import { affiliateRouter } from "./affiliate-router";
import { pricingRouter } from "./pricing-router";
import { commissionRouter } from "./commission-router";
import { featuredRouter } from "./featured-router";
import { promotionsRouter } from "./promotions-router";
import { verificationRouter } from "./verification-router";
import { mitraaScoreRouter } from "./mitraa-score-router";
import { negotiationRouter } from "./negotiation-router";
import { regionalRouter } from "./regional-router";
import { superAdminRouter } from "./super-admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  brand: brandRouter,
  influencer: influencerRouter,
  campaign: campaignRouter,
  admin: adminRouter,
  match: matchRouter,
  payment: paymentRouter,
  barter: barterRouter,
  consent: consentRouter,
  instagram: instagramRouter,
  mediaKit: mediaKitRouter,
  roi: roiRouter,
  affiliate: affiliateRouter,
  pricing: pricingRouter,
  commission: commissionRouter,
  featured: featuredRouter,
  promotions: promotionsRouter,
  verification: verificationRouter,
  mitraaScore: mitraaScoreRouter,
  negotiation: negotiationRouter,
  regional: regionalRouter,
  superAdmin: superAdminRouter,
});

export type AppRouter = typeof appRouter;
