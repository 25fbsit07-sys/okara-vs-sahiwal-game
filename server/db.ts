import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, players, heroes, gameSessions, leaderboard, units, quizQuestions, InsertPlayer, InsertHero, InsertGameSession, InsertLeaderboard, InsertUnit, InsertQuizQuestion } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Game-specific queries
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Player profile queries
export async function getOrCreatePlayer(userId: number, district?: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // Check if player exists
    const existing = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    // Create new player with default hero
    const newPlayer: InsertPlayer = {
      userId,
      district: (district as "okara" | "sahiwal") || "okara",
      lives: 1,
      totalWins: 0,
      totalLosses: 0,
      unlockedHeroes: JSON.stringify(["chaudhry-gehun-khan"]), // Default hero
      selectedHero: "chaudhry-gehun-khan",
      totalGamesPlayed: 0,
    };

    await db.insert(players).values(newPlayer);
    const created = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
    return created.length > 0 ? created[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get or create player:", error);
    return undefined;
  }
}

export async function getPlayerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get player:", error);
    return undefined;
  }
}

export async function updatePlayerDistrict(userId: number, district: "okara" | "sahiwal") {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(players).set({ district }).where(eq(players.userId, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update player district:", error);
    return false;
  }
}

export async function awardLifeToPlayer(userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    const player = await getPlayerByUserId(userId);
    if (!player) return false;

    await db.update(players).set({ lives: player.lives + 1 }).where(eq(players.userId, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to award life:", error);
    return false;
  }
}

export async function updatePlayerHero(userId: number, heroId: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    const player = await getPlayerByUserId(userId);
    if (!player) return false;

    const unlockedHeroes = JSON.parse(player.unlockedHeroes || "[]");
    if (!unlockedHeroes.includes(heroId)) {
      unlockedHeroes.push(heroId);
    }

    await db.update(players).set({
      selectedHero: heroId,
      unlockedHeroes: JSON.stringify(unlockedHeroes),
    }).where(eq(players.userId, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update player hero:", error);
    return false;
  }
}

// Hero queries
export async function getAllHeroes() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(heroes);
  } catch (error) {
    console.error("[Database] Failed to get heroes:", error);
    return [];
  }
}

export async function getHeroesByDistrict(district: "okara" | "sahiwal") {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(heroes).where(eq(heroes.district, district));
  } catch (error) {
    console.error("[Database] Failed to get heroes by district:", error);
    return [];
  }
}

export async function getHeroById(heroId: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(heroes).where(eq(heroes.id, heroId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get hero:", error);
    return undefined;
  }
}

// Game session queries
export async function createGameSession(data: InsertGameSession) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(gameSessions).values(data);
    const created = await db.select().from(gameSessions).where(eq(gameSessions.id, data.id)).limit(1);
    return created.length > 0 ? created[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create game session:", error);
    return undefined;
  }
}

export async function getGameSessionById(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get game session:", error);
    return undefined;
  }
}

export async function getActiveGameSession(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(gameSessions)
      .where(and(eq(gameSessions.playerId, playerId), eq(gameSessions.status, "active")))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get active game session:", error);
    return undefined;
  }
}

export async function endGameSession(sessionId: string, winner: number | null, playerScore: number, opponentScore: number | null) {
  const db = await getDb();
  if (!db) return false;

  try {
    const session = await getGameSessionById(sessionId);
    if (!session) return false;

    const duration = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);
    
    await db.update(gameSessions).set({
      status: "completed",
      winner,
      playerScore,
      opponentScore,
      duration,
      completedAt: new Date(),
    }).where(eq(gameSessions.id, sessionId));

    // Update player stats
    if (winner === session.playerId) {
      const player = await getPlayerByUserId(session.playerId);
      if (player) {
        await db.update(players).set({
          totalWins: player.totalWins + 1,
          totalGamesPlayed: player.totalGamesPlayed + 1,
        }).where(eq(players.userId, session.playerId));
      }
    } else if (winner === session.opponentId) {
      const player = await getPlayerByUserId(session.playerId);
      if (player) {
        await db.update(players).set({
          totalLosses: player.totalLosses + 1,
          totalGamesPlayed: player.totalGamesPlayed + 1,
        }).where(eq(players.userId, session.playerId));
      }
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to end game session:", error);
    return false;
  }
}

// Leaderboard queries
export async function getLeaderboardByDistrict(district: "okara" | "sahiwal", limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(leaderboard)
      .where(eq(leaderboard.district, district))
      .orderBy(desc(leaderboard.rank))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get leaderboard:", error);
    return [];
  }
}

export async function getPlayerLeaderboardRank(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(leaderboard).where(eq(leaderboard.playerId, playerId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get player rank:", error);
    return undefined;
  }
}

export async function updateLeaderboard(playerId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (player.length === 0) return false;

    const p = player[0];
    const totalGames = p.totalWins + p.totalLosses;
    const winRate = totalGames > 0 ? ((p.totalWins / totalGames) * 100) : 0;

    // Generate funny title based on win rate
    let funnyTitle = "Novice Warrior";
    if (winRate >= 80) funnyTitle = "The Wheat Warrior";
    else if (winRate >= 70) funnyTitle = "Buffalo Slayer";
    else if (winRate >= 60) funnyTitle = "Doodh Champion";
    else if (winRate >= 50) funnyTitle = "Roti Master";
    else if (winRate >= 40) funnyTitle = "Lassi Lover";
    else if (winRate >= 30) funnyTitle = "Tractor Rider";
    else if (winRate >= 20) funnyTitle = "Sahiwal Seeker";
    else if (winRate > 0) funnyTitle = "Okara Novice";

    // Get current rank count
    const rankCount = await db.select({ count: sql`COUNT(*)` }).from(leaderboard).where(eq(leaderboard.district, p.district));
    const rank = (rankCount[0]?.count as number) + 1;

    const existing = await db.select().from(leaderboard).where(eq(leaderboard.playerId, playerId)).limit(1);
    
    if (existing.length > 0) {
      await db.update(leaderboard).set({
        wins: p.totalWins,
        losses: p.totalLosses,
        winRate: winRate.toString(),
        funnyTitle,
      }).where(eq(leaderboard.playerId, playerId));
    } else {
      await db.insert(leaderboard).values({
        playerId,
        district: p.district,
        rank,
        wins: p.totalWins,
        losses: p.totalLosses,
        winRate: winRate.toString(),
        funnyTitle,
      });
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to update leaderboard:", error);
    return false;
  }
}

// Unit queries
export async function getAllUnits() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(units);
  } catch (error) {
    console.error("[Database] Failed to get units:", error);
    return [];
  }
}

export async function getUnitsByDistrict(district: "okara" | "sahiwal") {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(units).where(eq(units.district, district));
  } catch (error) {
    console.error("[Database] Failed to get units by district:", error);
    return [];
  }
}

// Quiz queries
export async function getRandomQuizQuestions(count: number = 5, difficulty?: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(quizQuestions);
    if (difficulty) {
      query = query.where(eq(quizQuestions.difficulty, difficulty as any));
    }
    const results = await query.limit(count);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get quiz questions:", error);
    return [];
  }
}
