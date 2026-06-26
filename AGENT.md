# Social Mitra — Product Documentation

## Overview

Social Mitra is a full-stack influencer marketing platform built as India's Creator-Brand Intelligence Platform. It connects brands with content creators using an AI-powered matchmaking engine, handles the entire collaboration lifecycle from discovery to payment, and provides role-specific dashboards for Creators, Brands, and Admins.

---

## Design Philosophy

The platform went through three design iterations, landing on a warm coral + deep teal aesthetic inspired by premium fintech interfaces. The design prioritizes trust, warmth, and clarity — using soft cream backgrounds, bold coral accents for CTAs, and teal for trust signals. Every interaction is designed to feel premium and intentional.

**Key Design Principles:**
- **Warmth over coldness**: Coral (`#E8735C`) instead of corporate blue
- **Generous whitespace**: Sections breathe with 96–144px vertical padding
- **Bold typography**: Extra-bold headlines with gradient accent words
- **Floating UI elements**: Notification badges that animate, creating depth
- **Pill-shaped CTAs**: Rounded-full buttons with gradient fills and soft shadows

---

## Frontend Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7.2 (HMR, tree-shaking, code splitting) |
| Styling | Tailwind CSS 3.4 + shadcn/ui component primitives |
| Routing | React Router v7 with HashRouter |
| Animations | GSAP + ScrollTrigger (entrance animations) |
| Fonts | Inter (body), system fallback |
| Icons | Lucide React |
| State | tRPC client with React Query caching |

### Page Structure

```
src/pages/
  Home.tsx           — Landing page (public)
  Login.tsx          — OAuth login redirect
  Onboarding.tsx     — Role selection (Brand vs Creator)
  BrandOnboarding.tsx — 5-step brand signup + AI requirement posting
  InfluencerOnboarding.tsx — 5-step creator signup + 42 categories
  BrandDashboard.tsx — Brand portal (6 tabs)
  InfluencerDashboard.tsx — Creator portal (5 tabs)
  AdminDashboard.tsx — Admin portal (5 tabs)
  NotFound.tsx       — 404 fallback
```

### Landing Page Sections (Home.tsx)

1. **Sticky Navbar** — Glassmorphic on scroll, coral pill CTA, mobile hamburger
2. **Hero** — Two-column grid with creator image, floating badges (AI Match 95%, Instant Payout 48h), dual CTAs
3. **Features** — 4 warm cards with emoji icons, descriptions, teal checkmark lists
4. **How It Works** — Connected vertical timeline with coral/teal gradient circles
5. **Categories** — 22+ pill tags on coral-tinted gradient background
6. **Image Banner** — Creator workspace flat-lay photography
7. **Testimonials** — Star-rated carousel with prev/next navigation
8. **CTA Section** — Dual coral + teal gradient buttons
9. **Footer** — 4-column grid with social links

### Creator Signup Flow (InfluencerOnboarding.tsx)

5-step wizard with progress bar:
1. **Personal Details** — Full name, display name/handle, bio, email, phone
2. **Social Media IDs** — Instagram, Facebook, YouTube, TikTok, Twitter, LinkedIn
3. **Creator Categories** — 42 multi-selectable category pills (Fashion, Beauty, Fitness, Food, Travel, Lifestyle, Technology, Finance, Education, Gaming, Parenting, Photography, Art, Music, Dance, Comedy, Motivation, Business, Health & Wellness, Sports, Automotive, Real Estate, Pets, DIY & Crafts, Book & Literature, News & Politics, Science, Environment, Spirituality, Relationships, Luxury, Review & Unboxing, Event Coverage, Cooking & Recipes, Home Decor, Gardening, Astrology, Legal Advice, Medical & Health, Entertainment, Vlogging, Podcasting)
4. **Location & Platforms** — City, state, active platforms (Instagram, YouTube, TikTok, Facebook, Twitter, LinkedIn), follower count, engagement rate
5. **Rate Card** — Per post, per story, per reel, per video rates (INR), portfolio link

### Brand Signup Flow (BrandOnboarding.tsx)

5-step wizard that includes AI requirement specification:
1. **Company Basics** — Company name, brand name, industry dropdown (16 options), email, phone
2. **Company Details** — Description, website, city, team size, monthly budget range
3. **Campaign Requirements** — Campaign title, description, content type selection (Reel, Static Post, Story, Long Video, Review/Unboxing, Live Session)
4. **Influencer Requirements** — 42 category multi-select, preferred location, creator count needed, preferred platforms
5. **Budget & Expectations** — Budget per creator, total budget, min/max followers, min engagement rate, min likes, min reach

After submission, the AI matchmaking engine runs automatically and redirects to the Brand Dashboard.

### Creator Dashboard (InfluencerDashboard.tsx)

5-tab sidebar navigation:
- **Overview** — 4 stat cards (Available Campaigns, My Applications, AI Matches, Total Earnings), quick action cards, top AI matches preview
- **Campaigns** — Browse all active brand campaigns with apply modal (message + proposed rate)
- **AI Matches** — Matched brand requirements with 7-factor breakdown (category, followers, engagement, location, budget, platform, ROI), match percentage circles, accept/decline actions
- **Earnings** — Payment history with status badges (Released/Escrow/Pending), amount tracking
- **Settings** — Profile viewer with all saved data including category pills and rate card

### Brand Dashboard (BrandDashboard.tsx)

6-tab sidebar navigation:
- **Overview** — 4 stat cards (Active Campaigns, Total Budget, AI Requirements, Completed), recent campaigns list
- **Campaigns** — Full campaign list with status badges, budget display, create campaign modal
- **Find Creators** — Search + grid of creator cards with invite/view profile buttons, follower counts, engagement rates
- **AI Matches** — Posted requirements with auto-matched status, matched creator count, category/content type pills
- **Payments** — Payment gateway with escrow tracking, release/refund actions, payment history
- **Settings** — Brand profile viewer

### Admin Dashboard (AdminDashboard.tsx)

5-tab sidebar navigation:
- **Overview** — 4 stat cards (Total Users, Brands, Creators, Campaigns), user distribution bar chart, quick actions grid
- **Users** — Full user table with avatar, name, email, role badge (color-coded), onboarding status, join date, role dropdown editor
- **Campaigns** — All platform campaigns with brand ID, status, budget
- **Payments** — All platform payments table with amount, status, gateway, date
- **Settings** — Admin profile + platform stats

---

## Backend Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| API Framework | Hono (fast, lightweight, Edge-compatible) |
| API Protocol | tRPC 11.x (end-to-end type safety) |
| ORM | Drizzle ORM (type-safe SQL builder) |
| Database | MySQL (TiDB Cloud) |
| Auth | OAuth 2.0 via Kimi platform |
| Sessions | JWT with httpOnly cookies |
| Validation | Zod schemas on all inputs |
| Serialization | superjson (handles Dates, Maps, Sets) |

### Project Structure

```
api/
  router.ts           — Root tRPC router (combines all sub-routers)
  middleware.ts       — Auth middleware (publicQuery, authedQuery, adminQuery)
  context.ts          — Request context builder (auth session → user)
  boot.ts             — Hono server setup + static file serving
  auth-router.ts      — Me, logout, role update, onboarding complete
  brand-router.ts     — Brand profile CRUD + public listing
  influencer-router.ts — Creator profile CRUD + search with filters
  campaign-router.ts  — Campaign CRUD + applications
  match-router.ts     — AI matchmaking engine + requirements
  payment-router.ts   — Payment gateway + escrow flow
  admin-router.ts     — Admin analytics + user management
  match-router.ts     — AI matchmaking with adaptive learning
db/
  schema.ts           — All table definitions
  migrations/         — Auto-generated migration files
```

### Database Schema

#### `users` — Core identity table
| Field | Type | Notes |
|-------|------|-------|
| id | serial PK | Auto-increment |
| unionId | varchar(255) | OAuth provider unique ID |
| name | varchar(255) | Display name from OAuth |
| email | varchar(320) | Email from OAuth |
| avatar | text | Profile photo URL |
| role | enum | user / brand / influencer / admin |
| onboardingComplete | boolean | Has completed role-specific signup |
| createdAt / updatedAt / lastSignInAt | timestamp | Auto-managed |

#### `influencer_profiles` — Creator extended data
| Field | Type | Notes |
|-------|------|-------|
| userId | bigint FK | Links to users |
| fullName / displayName | varchar(255) | Identity |
| bio | text | Creator description |
| email / phone | varchar | Contact info |
| instagramId / facebookId / youtubeId / tiktokId / twitterId / linkedinId | varchar | Social handles |
| categories | json | Array of 42 selected categories |
| niche | varchar | Primary content niche |
| location / city | varchar | Geographic data |
| followerCount / engagementRate / avgLikes / avgComments / avgReach | int/decimal | Audience metrics |
| platforms | json | Active social platforms |
| ratePerPost / ratePerStory / ratePerReel / ratePerVideo | decimal | Rate card (INR) |
| portfolioLinks / sampleWork | json/text | Work samples |
| verified | boolean | Verified creator badge |
| availableForCollaboration | boolean | Open for deals |

#### `brand_profiles` — Brand extended data
| Field | Type | Notes |
|-------|------|-------|
| userId | bigint FK | Links to users |
| companyName / brandName | varchar | Identity |
| industry | varchar | Industry vertical |
| website | varchar | Company URL |
| description | text | About the brand |
| email / phone | varchar | Contact info |
| location / city | varchar | Geographic data |
| teamSize / budgetRange | varchar | Company metadata |

#### `brand_requirements` — AI matchmaking input
| Field | Type | Notes |
|-------|------|-------|
| brandId | bigint FK | Who posted |
| campaignTitle / campaignDescription | varchar/text | Campaign brief |
| contentTypes | json | ["reel", "post", "story", "video", "review", "live"] |
| creatorCategories | json | Selected from 42 categories |
| minFollowers / maxFollowers | int | Audience size range |
| minEngagementRate | decimal | Minimum engagement % |
| preferredPlatforms | json | Target platforms |
| budgetPerCreator / totalBudget | decimal | Financial scope |
| creatorsNeeded | int | How many to hire |
| minReachExpected / minLikesExpected | int | Performance expectations |
| preferredLocation | varchar | Geographic preference |
| campaignStart / campaignEnd | date | Timeline |
| status | enum | draft / matching / active / completed / cancelled |
| autoMatched | boolean | AI has processed this |

#### `ai_matches` — AI matchmaking output
| Field | Type | Notes |
|-------|------|-------|
| requirementId / influencerId | bigint FK | The pair |
| matchScore | int | 0-100 overall compatibility |
| matchReason | text | Human-readable explanation |
| categoryMatch / followerMatch / engagementMatch / locationMatch / budgetMatch / platformMatch | int | Individual factor scores 0-100 |
| status | enum | suggested / invited / accepted / declined |

#### `campaigns` — Traditional campaign postings
| Field | Type | Notes |
|-------|------|-------|
| brandId | bigint FK | Creator |
| title / description / requirements | varchar/text | Campaign brief |
| platform / contentType | enum | Instagram/YouTube/TikTok/All |
| budget / creatorCount | decimal/int | Resources |
| niche / location / followerMin / followerMax | various | Targeting |
| status | enum | draft / active / paused / completed / cancelled |

#### `campaign_applications` — Creator applications
| Field | Type | Notes |
|-------|------|-------|
| campaignId / influencerId | bigint FK | The pair |
| message | text | Application note |
| proposedRate | decimal | Negotiated rate |
| status | enum | pending / accepted / rejected / completed |

#### `payments` — Payment gateway
| Field | Type | Notes |
|-------|------|-------|
| brandId / influencerId | bigint FK | Transaction parties |
| campaignId | bigint FK | Related campaign |
| amount / currency | decimal/varchar | Transaction value |
| gateway / gatewayPaymentId | varchar | Payment provider tracking |
| gatewayStatus | enum | pending / processing / completed / failed / refunded |
| status | enum | pending / escrow / released / refunded |

### API Endpoints (tRPC Routers)

#### `auth` Router
- `auth.me` — Returns current authenticated user
- `auth.logout` — Clears session cookie
- `auth.updateRole` — Sets user role (brand/influencer/admin)
- `auth.completeOnboarding` — Marks onboarding as done

#### `brand` Router
- `brand.getProfile` — Get brand profile for logged-in user
- `brand.updateProfile` — Create/update brand profile
- `brand.list` — Public listing of all brands
- `brand.getById` — Get single brand by ID

#### `influencer` Router
- `influencer.getProfile` — Get creator profile for logged-in user
- `influencer.updateProfile` — Create/update creator profile (handles all 42 categories, 6 social IDs, 4 rate types)
- `influencer.list` — Public listing with filters (niche, location, min/max followers)
- `influencer.getById` — Get single creator by ID
- `influencer.search` — Advanced search with all filter dimensions

#### `campaign` Router
- `campaign.create` — Create new campaign (brand only)
- `campaign.update` — Modify existing campaign
- `campaign.list` — Public listing of active campaigns
- `campaign.myCampaigns` — Brand's own campaigns
- `campaign.getById` — Single campaign details
- `campaign.apply` — Creator applies to campaign
- `campaign.myApplications` — Creator's applications
- `campaign.getApplications` — Brand views applications for their campaign

#### `match` Router (AI Engine)
- `match.getCategories` — Returns all 42 creator categories
- `match.createRequirement` — Brand posts detailed requirements
- `match.myRequirements` — Brand's posted requirements
- `match.runMatching` — **Executes AI matchmaking algorithm**
- `match.getMatches` — Get AI matches for a requirement (with full influencer data)
- `match.myMatches` — Creator's AI matches (with requirement data)
- `match.updateMatchStatus` — Accept/decline a match
- `match.getInsights` — Platform-wide match analytics (accept rates, averages)

#### `payment` Router
- `payment.create` — Create payment in escrow
- `payment.myPayments` — Brand's payment history
- `payment.myEarnings` — Creator's earnings history
- `payment.release` — Release escrow to creator
- `payment.refund` — Refund payment to brand
- `payment.listAll` — Admin: all platform payments

#### `admin` Router
- `admin.getStats` — Platform-wide statistics (user counts, role distribution)
- `admin.listUsers` — All users with profile data
- `admin.updateUserRole` — Change any user's role
- `admin.listCampaigns` — All campaigns on platform
- `admin.approveBrand` / `admin.approveInfluencer` — Verification badges

---

## AI Matchmaking Engine

### 7-Factor Scoring Algorithm

The engine calculates a weighted compatibility score from 7 dimensions:

| Factor | Default Weight | How It Works |
|--------|---------------|-------------|
| **Category Match** | 25% | Exact category = 100%, related category = 60%. Uses a relation matrix (Fashion ↔ Beauty, Fitness ↔ Health, etc.) |
| **Engagement Rate** | 20% | Compares creator's engagement % against brand's minimum. Exceeding target scores higher |
| **Follower Count** | 18% | Checks if within brand's min/max range. Near-range gets partial credit |
| **Budget Fit** | 12% | Creator's rate card vs brand's per-creator budget |
| **Location** | 10% | Geographic match (city/state overlap) |
| **Platform** | 8% | Overlap between brand's preferred platforms and creator's active platforms |
| **Predicted ROI** | 7% | Calculated from comment-to-like ratio, micro-influencer bonus, engagement quality |

### Adaptive Learning

The engine **learns from outcomes** over time:
- Tracks accept/decline rates across all historical matches
- If accept rate < 30%: increases category and engagement weights (stronger signals needed)
- If accept rate > 60%: trusts budget and location weights more
- After 20+ matches: activates historical ROI weighting
- Weights are returned with each match for transparency

### Category Relation Matrix

42 categories with bidirectional relations. Example mappings:
- Fashion ↔ Beauty, Lifestyle, Luxury, Photography
- Technology ↔ Science, Business, Education, Gaming
- Fitness ↔ Health & Wellness, Sports, Food, Lifestyle
- Parenting ↔ Relationships, Lifestyle, Home Decor, Education

This allows partial credit when a creator's categories are adjacent to the brand's requested categories.

### Match Output

Each match includes:
- **Overall score** (0-100%)
- **7 individual factor scores**
- **Human-readable reason** (e.g., "Exact category match: Fashion, Beauty; 50K followers within target range")
- **Predicted ROI score**
- **Insights** (additional observations)

---

## Authentication Flow

1. User clicks "Sign in with Kimi" on login page
2. Frontend redirects to Kimi OAuth authorize URL with client_id, redirect_uri, scope=profile
3. User authenticates on Kimi platform
4. Kimi redirects back to `/api/oauth/callback` with authorization code
5. Backend exchanges code for access token + user profile
6. User record created/updated in `users` table
7. JWT session cookie set (httpOnly, secure, SameSite)
8. User redirected to `/onboarding` for role selection
9. After role selection + signup completion → respective dashboard

**Role Middleware:**
- `publicQuery` — No auth required (landing page data)
- `authedQuery` — Valid session required
- `adminQuery` — Auth + role === 'admin' (returns 403 otherwise)

---

## Payment Flow

1. Brand creates payment → goes into **escrow** status
2. Creator completes work → brand reviews
3. Brand releases payment → status changes to **released**
4. Creator receives funds via integrated gateway
5. Optional: Brand can **refund** before release

All transactions tracked with gateway provider ID, status history, and full audit trail.

---

## Deployment Notes

### Static Deployment (kimi.page)
- Frontend files served as static assets
- **Limitation**: Backend API (`/api/oauth/callback`, `/api/trpc/*`) requires Node.js runtime
- **Workaround**: Use HashRouter for client-side navigation
- **Impact**: OAuth login, database operations, AI matching require full-stack deployment

### Full-Stack Deployment (Railway/Render)
- Backend server (Hono) serves both API and frontend static files
- `boot.ts` handles API routes first, falls back to `index.html` for client routes
- All features work: OAuth, database, AI matching, payments

**Required Environment Variables:**
```
APP_ID / APP_SECRET — Kimi OAuth credentials
DATABASE_URL — MySQL connection string
KIMI_AUTH_URL / KIMI_OPEN_URL — Kimi platform URLs
OWNER_UNION_ID — Admin union ID
VITE_APP_ID / VITE_KIMI_AUTH_URL — Frontend OAuth config
```

---

## File Inventory

### Generated Assets
- `/public/hero-v2.jpg` — Hero section creator portrait (warm tones)
- `/public/collab-v2.jpg` — Creator workspace flat-lay
- `/public/hero-light.jpg` — Previous hero (retained)
- `/public/avatar-brand-1.jpg` — Brand testimonial 1
- `/public/avatar-brand-2.jpg` — Brand testimonial 2
- `/public/avatar-brand-3.jpg` — Brand testimonial 3
- `/public/avatar-creator-1.jpg` — Creator testimonial 1
- `/public/avatar-creator-2.jpg` — Creator testimonial 2
- `/public/avatar-creator-3.jpg` — Creator testimonial 3

### Key Source Files
- `src/index.css` — Complete design system (CSS custom properties, utilities, animations)
- `src/App.tsx` — Route definitions for all 9 pages
- `src/main.tsx` — App entry with HashRouter + tRPC provider
- `src/hooks/useAuth.ts` — Auth state hook with role detection
- `src/providers/trpc.tsx` — tRPC client with API URL config
- `db/schema.ts` — 7 table definitions with full type inference
- `api/match-router.ts` — AI matchmaking engine (280+ lines)

---

## Summary of What Was Built

| Feature | Status |
|---------|--------|
| Warm coral + teal landing page | ✅ Complete |
| 42-category creator signup (5-step) | ✅ Complete |
| Brand signup with AI requirements (5-step) | ✅ Complete |
| Creator dashboard (5 tabs) | ✅ Complete |
| Brand dashboard (6 tabs) | ✅ Complete |
| Admin dashboard (5 tabs) | ✅ Complete |
| 7-factor AI matchmaking engine | ✅ Complete |
| Adaptive learning (weight adjustment) | ✅ Complete |
| Category relation matrix (42×42) | ✅ Complete |
| Payment gateway with escrow | ✅ Complete |
| OAuth 2.0 authentication | ✅ Complete |
| Role-based access control | ✅ Complete |
| Database schema (7 tables) | ✅ Complete |
| tRPC API (40+ endpoints) | ✅ Complete |
| Mobile responsive design | ✅ Complete |
| GSAP scroll animations | ✅ Complete |

**Total Lines of Code:** ~5,000+ (frontend + backend + schema)
**Design Iterations:** 3 (dark navy → light blue → warm coral)
