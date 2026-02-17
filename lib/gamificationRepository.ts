// lib/gamificationRepository.ts
import { supabase } from "./supabaseClient";
import { getSupabaseAdmin } from "./supabaseAdmin";

const USER_STATS_TABLE = "user_stats";
const ACHIEVEMENTS_TABLE = "achievements";
const USER_ACHIEVEMENTS_TABLE = "user_achievements";
const POINTS_HISTORY_TABLE = "points_history";

export interface UserStats {
  userId: string;
  totalPoints: number;
  activitiesCreated: number;
  activitiesJoined: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  level: number;
}

export interface Achievement {
  id: string;
  achievementKey: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: "creation" | "participation" | "streak" | "social";
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}

// Point values for different actions
export const POINT_VALUES = {
  ACTIVITY_CREATED: 50,
  ACTIVITY_JOINED: 25,
  ACHIEVEMENT_UNLOCKED: 100,
  STREAK_BONUS: 10, // Bonus per day of streak
} as const;

// Points needed per level (exponential growth)
export function getPointsForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Get user stats.
 * Does NOT create stats if missing (to avoid RLS write issues on client).
 * Returns default/empty stats if no record found.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[gamificationRepository] getUserStats error", error);
    // Return default stats on error to prevent UI crash
    return createDefaultStatsObject(userId);
  }

  if (!data) {
    // Return virtual default stats, don't write to DB from client
    return createDefaultStatsObject(userId);
  }

  return mapRowToUserStats(data);
}

/**
 * Helper to create default stats object in memory
 */
function createDefaultStatsObject(userId: string): UserStats {
  return {
    userId,
    totalPoints: 0,
    activitiesCreated: 0,
    activitiesJoined: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    level: 1,
  };
}

/**
 * Internal: Create user stats row in DB (Requires appropriate permissions/client)
 */
async function createUserStatsInDb(userId: string, rlsSafeClient: any): Promise<UserStats> {
  const { data, error } = await rlsSafeClient
    .from(USER_STATS_TABLE)
    .insert({
      user_id: userId,
      total_points: 0,
      activities_created: 0,
      activities_joined: 0,
      current_streak: 0,
      longest_streak: 0,
      level: 1,
    })
    .select()
    .single();

  if (error) {
    // If conflict, just return existing
    if (error.code === '23505') { // unique_violation
      const { data: existing } = await rlsSafeClient
        .from(USER_STATS_TABLE)
        .select("*")
        .eq("user_id", userId)
        .single();
      return mapRowToUserStats(existing);
    }
    console.error("[gamificationRepository] createUserStatsInDb error", error);
    throw error;
  }

  return mapRowToUserStats(data);
}

function mapRowToUserStats(row: any): UserStats {
  return {
    userId: row.user_id,
    totalPoints: row.total_points ?? 0,
    activitiesCreated: row.activities_created ?? 0,
    activitiesJoined: row.activities_joined ?? 0,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastActivityDate: row.last_activity_date ?? null,
    level: row.level ?? 1,
  };
}

/**
 * Award points to a user.
 * USES ADMIN CLIENT to bypass RLS for writes.
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  activityId?: string | null,
  achievementId?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get current stats using admin to ensure we can see/write
  const { data: currentStats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!currentStats) {
    // Create stats if they don't exist, using ADMIN
    await createUserStatsInDb(userId, supabaseAdmin);
  }

  // Fetch again (or use result from create) to get latest state for update
  const { data: statsToUpdate } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!statsToUpdate) return; // Should not happen

  const newTotalPoints = (statsToUpdate.total_points ?? 0) + points;

  // Calculate new level
  let newLevel = statsToUpdate.level ?? 1;
  while (newTotalPoints >= getPointsForLevel(newLevel + 1)) {
    newLevel++;
  }

  // Update user stats
  await supabaseAdmin
    .from(USER_STATS_TABLE)
    .update({
      total_points: newTotalPoints,
      level: newLevel,
    })
    .eq("user_id", userId);

  // Log points history
  await supabaseAdmin.from(POINTS_HISTORY_TABLE).insert({
    user_id: userId,
    points,
    reason,
    activity_id: activityId ?? null,
    achievement_id: achievementId ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  // Check for new achievements
  await checkAndUnlockAchievements(userId);
}

/**
 * Increment activity created count and award points
 */
export async function onActivityCreated(userId: string, activityId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Ensure stats exist
  const { data: currentStats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!currentStats) {
    await createUserStatsInDb(userId, supabaseAdmin);
  }

  // Get freshly (or possibly just created) stats to increment
  const { data: stats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("activities_created")
    .eq("user_id", userId)
    .single();

  await supabaseAdmin
    .from(USER_STATS_TABLE)
    .update({
      activities_created: (stats?.activities_created ?? 0) + 1,
      last_activity_date: new Date().toISOString().split("T")[0],
    })
    .eq("user_id", userId);

  // Update streak
  await updateStreak(userId);

  // Award points
  await awardPoints(
    userId,
    POINT_VALUES.ACTIVITY_CREATED,
    "activity_created",
    activityId
  );
}

/**
 * Increment activity joined count and award points
 */
export async function onActivityJoined(userId: string, activityId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Ensure stats exist
  const { data: currentStats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!currentStats) {
    await createUserStatsInDb(userId, supabaseAdmin);
  }

  const { data: stats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("activities_joined")
    .eq("user_id", userId)
    .single();

  await supabaseAdmin
    .from(USER_STATS_TABLE)
    .update({
      activities_joined: (stats?.activities_joined ?? 0) + 1,
      last_activity_date: new Date().toISOString().split("T")[0],
    })
    .eq("user_id", userId);

  // Update streak
  await updateStreak(userId);

  // Award points
  await awardPoints(
    userId,
    POINT_VALUES.ACTIVITY_JOINED,
    "activity_joined",
    activityId
  );
}

/**
 * Update user streak based on last activity date
 */
async function updateStreak(userId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: stats } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!stats) return;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const lastActivityDate = stats.last_activity_date;

  let newStreak = stats.current_streak ?? 0;
  let newLongestStreak = stats.longest_streak ?? 0;

  if (lastActivityDate === today) {
    // Already counted today, no change
    return;
  } else if (lastActivityDate === yesterday) {
    // Continue streak
    newStreak = (stats.current_streak ?? 0) + 1;
  } else {
    // Reset streak
    newStreak = 1;
  }

  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  await supabaseAdmin
    .from(USER_STATS_TABLE)
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
    })
    .eq("user_id", userId);

  // Award streak bonus points
  if (newStreak > 1) {
    await awardPoints(
      userId,
      POINT_VALUES.STREAK_BONUS * newStreak,
      "streak_bonus",
      null,
      null,
      { streak: newStreak }
    );
  }
}

/**
 * Check and unlock achievements based on current stats
 */
async function checkAndUnlockAchievements(userId: string): Promise<void> {
  // Use admin because we are running in backend context usually
  // But wait, getUserStats uses public client which is fine for reading logic 
  // if we used the fetched stats from earlier?
  // Let's just use admin for consistency in this flow
  const supabaseAdmin = getSupabaseAdmin();

  const { data: statsData } = await supabaseAdmin
    .from(USER_STATS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!statsData) return;
  const stats = mapRowToUserStats(statsData);

  // Get all achievements
  const { data: allAchievements } = await supabaseAdmin
    .from(ACHIEVEMENTS_TABLE)
    .select("*");

  if (!allAchievements) return;

  // Get unlocked achievements
  const { data: unlocked } = await supabaseAdmin
    .from(USER_ACHIEVEMENTS_TABLE)
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((unlocked ?? []).map((u) => u.achievement_id));

  // Check each achievement
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.achievement_key) {
      case "first_activity":
        shouldUnlock = stats.activitiesCreated >= 1;
        break;
      case "creator_5":
        shouldUnlock = stats.activitiesCreated >= 5;
        break;
      case "creator_10":
        shouldUnlock = stats.activitiesCreated >= 10;
        break;
      case "creator_25":
        shouldUnlock = stats.activitiesCreated >= 25;
        break;
      case "creator_50":
        shouldUnlock = stats.activitiesCreated >= 50;
        break;
      case "joiner_5":
        shouldUnlock = stats.activitiesJoined >= 5;
        break;
      case "joiner_10":
        shouldUnlock = stats.activitiesJoined >= 10;
        break;
      case "joiner_25":
        shouldUnlock = stats.activitiesJoined >= 25;
        break;
      case "joiner_50":
        shouldUnlock = stats.activitiesJoined >= 50;
        break;
      case "streak_3":
        shouldUnlock = stats.currentStreak >= 3;
        break;
      case "streak_7":
        shouldUnlock = stats.currentStreak >= 7;
        break;
      case "streak_14":
        shouldUnlock = stats.currentStreak >= 14;
        break;
      case "streak_30":
        shouldUnlock = stats.currentStreak >= 30;
        break;
      case "points_100":
        shouldUnlock = stats.totalPoints >= 100;
        break;
      case "points_500":
        shouldUnlock = stats.totalPoints >= 500;
        break;
      case "points_1000":
        shouldUnlock = stats.totalPoints >= 1000;
        break;
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, achievement.id);
    }
  }
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Check if already unlocked
  const { data: existing } = await supabaseAdmin
    .from(USER_ACHIEVEMENTS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .maybeSingle();

  if (existing) return; // Already unlocked

  // Unlock achievement
  await supabaseAdmin.from(USER_ACHIEVEMENTS_TABLE).insert({
    user_id: userId,
    achievement_id: achievementId,
  });

  // Award bonus points - careful of infinite loop, prevent awarding points for point-achievements recursively if needed
  // But here we use awardPoints with reason 'achievement_unlocked', which doesn't trigger achievement check loop necessarily?
  // awardPoints CALLS checkAndUnlockAchievements.
  // BUT the achievement is already unlocked in DB above.
  // So checkAndUnlockAchievements will see it's unlocked and NOT try to unlock it again.
  // So we are safe from infinite loop for the SAME achievement.
  // However, receiving points might unlock a POINTS achievement.
  // That is fine, it will cascade naturally until no more are unlocked.

  await awardPoints(
    userId,
    POINT_VALUES.ACHIEVEMENT_UNLOCKED,
    "achievement_unlocked",
    null,
    achievementId
  );
}

/**
 * Get user achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from(USER_ACHIEVEMENTS_TABLE)
    .select(`
      achievement_id,
      unlocked_at,
      achievements:achievement_id (
        id,
        achievement_key,
        title,
        description,
        icon,
        points_required,
        category
      )
    `)
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("[gamificationRepository] getUserAchievements error", error);
    return []; // Return empty array on error
  }

  return (data ?? []).map((row: any) => ({
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
    achievement: {
      id: row.achievements.id,
      achievementKey: row.achievements.achievement_key,
      title: row.achievements.title,
      description: row.achievements.description,
      icon: row.achievements.icon,
      pointsRequired: row.achievements.points_required,
      category: row.achievements.category,
    },
  }));
}

/**
 * Get leaderboard (top users by points)
 */
export async function getLeaderboard(limit: number = 10): Promise<UserStats[]> {
  const { data, error } = await supabase
    .from(USER_STATS_TABLE)
    .select("*")
    .order("total_points", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[gamificationRepository] getLeaderboard error", error);
    return [];
  }

  return (data ?? []).map(mapRowToUserStats);
}

/**
 * Get top creators
 */
export async function getTopCreators(limit: number = 10): Promise<UserStats[]> {
  const { data, error } = await supabase
    .from(USER_STATS_TABLE)
    .select("*")
    .order("activities_created", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[gamificationRepository] getTopCreators error", error);
    return [];
  }

  return (data ?? []).map(mapRowToUserStats);
}

/**
 * Get top joiners
 */
export async function getTopJoiners(limit: number = 10): Promise<UserStats[]> {
  const { data, error } = await supabase
    .from(USER_STATS_TABLE)
    .select("*")
    .order("activities_joined", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[gamificationRepository] getTopJoiners error", error);
    return [];
  }

  return (data ?? []).map(mapRowToUserStats);
}
