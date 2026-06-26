/**
 * Instagram Analytics Engine
 * Fetches profile data, calculates engagement metrics,
 * detects fake followers, and provides audience insights.
 */

interface InstagramPost {
  likes: number;
  comments: number;
  caption: string;
  timestamp: string;
  type: string;
}

interface InstagramAnalytics {
  // Basic Profile
  username: string;
  fullName: string;
  biography: string;
  followers: number;
  following: number;
  postsCount: number;
  profilePicUrl: string;
  isPrivate: boolean;
  isVerified: boolean;

  // Engagement Metrics
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  likeEngagementRate: number;
  commentEngagementRate: number;

  // Content Analysis
  postFrequency: number; // posts per week
  topHashtags: string[];
  contentTypes: { reel: number; post: number; carousel: number };

  // Follower Quality
  fakeFollowerScore: number; // 0-100, higher = more fake
  fakeFollowerPercentage: number;
  followerQualityRating: "Excellent" | "Good" | "Average" | "Poor" | "Suspicious";

  // Audience Insights (estimated)
  estimatedReach: number;
  estimatedImpressions: number;
  audienceActivity: "High" | "Medium" | "Low";

  // Overall Score
  overallScore: number; // 0-100
  overallRating: "Excellent" | "Good" | "Average" | "Poor";

  // Raw data timestamp
  fetchedAt: string;
}

/**
 * Fake Follower Detection Algorithm
 * Uses multiple heuristics to estimate fake follower percentage
 */
function detectFakeFollowers(
  followers: number,
  following: number,
  engagementRate: number,
  postsCount: number,
  avgLikes: number,
  avgComments: number
): { score: number; percentage: number; rating: InstagramAnalytics["followerQualityRating"] } {
  let score = 0; // 0 = all real, 100 = all fake
  const flags: string[] = [];

  // 1. Engagement rate check
  if (followers > 1000 && followers <= 10000) {
    if (engagementRate < 1.5) { score += 25; flags.push("very_low_engagement_micro"); }
    else if (engagementRate > 8) { score += 10; flags.push("suspiciously_high_engagement"); }
  } else if (followers > 10000 && followers <= 100000) {
    if (engagementRate < 1.0) { score += 30; flags.push("very_low_engagement_mid"); }
    else if (engagementRate < 2.0) { score += 15; flags.push("low_engagement_mid"); }
  } else if (followers > 100000) {
    if (engagementRate < 0.5) { score += 35; flags.push("very_low_engagement_macro"); }
    else if (engagementRate < 1.0) { score += 20; flags.push("low_engagement_macro"); }
  }

  // 2. Follower-to-following ratio
  const ratio = following > 0 ? followers / following : 0;
  if (ratio < 0.5 && followers > 5000) { score += 15; flags.push("suspicious_follow_ratio"); }

  // 3. Like-to-comment ratio (should be roughly 20-50:1)
  if (avgComments > 0) {
    const likeCommentRatio = avgLikes / avgComments;
    if (likeCommentRatio > 200) { score += 10; flags.push("abnormal_like_comment_ratio"); }
  }

  // 4. Account activity (posts per month)
  if (postsCount < 10 && followers > 10000) { score += 10; flags.push("low_activity_high_followers"); }

  // 5. Comment authenticity (very low comments = likely fake)
  if (avgComments < 5 && followers > 10000) { score += 15; flags.push("very_low_comments"); }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  // Calculate estimated fake percentage (non-linear mapping)
  const fakePercentage = Math.round(score * 0.8 + (Math.random() * 5)); // Add small variance

  // Determine rating
  let rating: InstagramAnalytics["followerQualityRating"];
  if (score <= 10) rating = "Excellent";
  else if (score <= 25) rating = "Good";
  else if (score <= 45) rating = "Average";
  else if (score <= 65) rating = "Poor";
  else rating = "Suspicious";

  return { score, percentage: Math.min(95, fakePercentage), rating };
}

/**
 * Extract top hashtags from captions
 */
function extractHashtags(posts: InstagramPost[]): string[] {
  const hashtagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    const hashtags = post.caption?.match(/#\w+/g) || [];
    hashtags.forEach((tag) => {
      const cleanTag = tag.toLowerCase();
      hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
    });
  });
  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
}

/**
 * Calculate overall influencer score
 */
function calculateOverallScore(
  engagementRate: number,
  followers: number,
  fakeScore: number,
  postFrequency: number
): { score: number; rating: InstagramAnalytics["overallRating"] } {
  let score = 0;

  // Engagement score (40%)
  let engScore = 0;
  if (engagementRate >= 5) engScore = 40;
  else if (engagementRate >= 3) engScore = 35;
  else if (engagementRate >= 2) engScore = 30;
  else if (engagementRate >= 1) engScore = 20;
  else if (engagementRate >= 0.5) engScore = 10;
  else engScore = 5;
  score += engScore;

  // Follower quality score (30%) - inverse of fake score
  const qualityScore = Math.round((1 - fakeScore / 100) * 30);
  score += qualityScore;

  // Follower count score (15%) - size matters but not everything
  let sizeScore = 0;
  if (followers >= 1000000) sizeScore = 15;
  else if (followers >= 500000) sizeScore = 14;
  else if (followers >= 100000) sizeScore = 13;
  else if (followers >= 50000) sizeScore = 12;
  else if (followers >= 10000) sizeScore = 11;
  else if (followers >= 5000) sizeScore = 9;
  else if (followers >= 1000) sizeScore = 7;
  else sizeScore = 5;
  score += sizeScore;

  // Activity score (15%)
  let activityScore = 0;
  if (postFrequency >= 3) activityScore = 15;
  else if (postFrequency >= 2) activityScore = 12;
  else if (postFrequency >= 1) activityScore = 10;
  else if (postFrequency >= 0.5) activityScore = 7;
  else activityScore = 5;
  score += activityScore;

  score = Math.min(100, score);

  let rating: InstagramAnalytics["overallRating"];
  if (score >= 80) rating = "Excellent";
  else if (score >= 60) rating = "Good";
  else if (score >= 40) rating = "Average";
  else rating = "Poor";

  return { score, rating };
}

/**
 * Fetch Instagram analytics for a given username
 * Uses web scraping approach via available APIs
 */
export async function fetchInstagramAnalytics(username: string): Promise<InstagramAnalytics | null> {
  try {
    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) return null;

    // ─── Method 1: Try RapidAPI Instagram Scraper ───
    // Note: In production, you'd use a real API key. This is a mock implementation
    // that simulates realistic data patterns for demo purposes.

    // For now, simulate realistic analytics based on username patterns
    // In production, replace with actual API calls:
    //
    // const response = await fetch(`https://instagram-scraper-api.p.rapidapi.com/user/${cleanUsername}`, {
    //   headers: {
    //     "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
    //     "X-RapidAPI-Host": "instagram-scraper-api.p.rapidapi.com"
    //   }
    // });
    // const data = await response.json();

    // ─── Simulated Realistic Data ───
    // Hash the username to generate consistent mock data
    const hash = cleanUsername.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const seed = (n: number, min: number, max: number) => min + (hash * n * 7 + n * 13) % (max - min);

    const followers = seed(1, 5000, 500000);
    const following = seed(2, 200, Math.min(followers * 0.3, 5000));
    const postsCount = seed(3, 30, 500);
    const avgLikes = Math.round(followers * (seed(4, 10, 50) / 1000));
    const avgComments = Math.round(avgLikes * (seed(5, 5, 20) / 100));
    const engagementRate = parseFloat(((avgLikes + avgComments) / followers * 100).toFixed(2));

    // Generate mock posts
    const mockPosts: InstagramPost[] = [];
    const now = new Date();
    for (let i = 0; i < Math.min(12, postsCount); i++) {
      const postDate = new Date(now.getTime() - i * seed(i + 10, 2, 8) * 24 * 60 * 60 * 1000);
      mockPosts.push({
        likes: Math.round(avgLikes * (0.7 + Math.random() * 0.6)),
        comments: Math.round(avgComments * (0.5 + Math.random() * 1)),
        caption: `Amazing content! ${["#fashion", "#lifestyle", "#beauty", "#travel", "#food"][i % 5]} #collab`,
        timestamp: postDate.toISOString(),
        type: ["reel", "carousel", "post"][i % 3],
      });
    }

    // Post frequency (posts per week)
    const oldestPost = new Date(mockPosts[mockPosts.length - 1]?.timestamp || now);
    const weeksDiff = Math.max(1, (now.getTime() - oldestPost.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const postFrequency = parseFloat((mockPosts.length / weeksDiff).toFixed(1));

    // Content type breakdown
    const contentTypes = {
      reel: mockPosts.filter((p) => p.type === "reel").length,
      post: mockPosts.filter((p) => p.type === "post").length,
      carousel: mockPosts.filter((p) => p.type === "carousel").length,
    };

    // Fake follower detection
    const fakeDetection = detectFakeFollowers(followers, following, engagementRate, postsCount, avgLikes, avgComments);

    // Hashtag analysis
    const topHashtags = extractHashtags(mockPosts);

    // Overall score
    const overall = calculateOverallScore(engagementRate, followers, fakeDetection.score, postFrequency);

    // Audience activity
    let audienceActivity: InstagramAnalytics["audienceActivity"];
    if (engagementRate >= 3) audienceActivity = "High";
    else if (engagementRate >= 1.5) audienceActivity = "Medium";
    else audienceActivity = "Low";

    return {
      username: cleanUsername,
      fullName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
      biography: `Creator passionate about ${topHashtags.slice(0, 3).join(", ").replace(/#/g, "")}. DM for collaborations.`,
      followers,
      following,
      postsCount,
      profilePicUrl: ``,
      isPrivate: false,
      isVerified: followers > 100000,
      avgLikes,
      avgComments,
      engagementRate,
      likeEngagementRate: parseFloat((avgLikes / followers * 100).toFixed(2)),
      commentEngagementRate: parseFloat((avgComments / followers * 100).toFixed(2)),
      postFrequency,
      topHashtags,
      contentTypes,
      fakeFollowerScore: fakeDetection.score,
      fakeFollowerPercentage: fakeDetection.percentage,
      followerQualityRating: fakeDetection.rating,
      estimatedReach: Math.round(followers * (engagementRate / 100) * 3),
      estimatedImpressions: Math.round(followers * (engagementRate / 100) * 5),
      audienceActivity,
      overallScore: overall.score,
      overallRating: overall.rating,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Instagram analytics error:", error);
    return null;
  }
}

export type { InstagramAnalytics };
