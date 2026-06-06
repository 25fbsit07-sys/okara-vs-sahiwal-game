import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Player profile table - extends users with game-specific data
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  district: mysqlEnum("district", ["okara", "sahiwal"]).notNull(),
  lives: int("lives").default(1).notNull(),
  totalWins: int("totalWins").default(0).notNull(),
  totalLosses: int("totalLosses").default(0).notNull(),
  unlockedHeroes: text("unlockedHeroes").notNull(), // JSON array of hero IDs
  selectedHero: varchar("selectedHero", { length: 64 }),
  totalGamesPlayed: int("totalGamesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Heroes table - defines all available heroes
 */
export const heroes = mysqlTable("heroes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  district: mysqlEnum("district", ["okara", "sahiwal"]).notNull(),
  description: text("description"),
  specialMove: varchar("specialMove", { length: 256 }).notNull(),
  baseHealth: int("baseHealth").default(100).notNull(),
  baseAttack: int("baseAttack").default(20).notNull(),
  baseSpeed: int("baseSpeed").default(10).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Hero = typeof heroes.$inferSelect;
export type InsertHero = typeof heroes.$inferInsert;

/**
 * Game sessions table - tracks individual game matches
 */
export const gameSessions = mysqlTable("gameSessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  playerId: int("playerId").notNull(),
  opponentId: int("opponentId"),
  gameMode: mysqlEnum("gameMode", ["1v1_direct_war", "territory_capture", "quiz_war"]).notNull(),
  playerDistrict: mysqlEnum("playerDistrict", ["okara", "sahiwal"]).notNull(),
  opponentDistrict: mysqlEnum("opponentDistrict", ["okara", "sahiwal"]),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  winner: int("winner"),
  playerScore: int("playerScore").default(0).notNull(),
  opponentScore: int("opponentScore").default(0),
  duration: int("duration"), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;

/**
 * Leaderboard table - denormalized for fast queries
 */
export const leaderboard = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull().unique(),
  district: mysqlEnum("district", ["okara", "sahiwal"]).notNull(),
  rank: int("rank").notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  funnyTitle: varchar("funnyTitle", { length: 256 }).default("Novice Warrior").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;

/**
 * Units table - defines all game units
 */
export const units = mysqlTable("units", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  district: mysqlEnum("district", ["okara", "sahiwal"]).notNull(),
  type: varchar("type", { length: 64 }).notNull(), // e.g., "ranged", "melee", "support"
  baseHealth: int("baseHealth").default(50).notNull(),
  baseAttack: int("baseAttack").default(15).notNull(),
  baseSpeed: int("baseSpeed").default(5).notNull(),
  cost: int("cost").default(100).notNull(), // resource cost to spawn
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

/**
 * Quiz questions table - for Quiz War mode
 */
export const quizQuestions = mysqlTable("quizQuestions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of 4 options
  correctAnswer: int("correctAnswer").notNull(), // index of correct option (0-3)
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  topic: varchar("topic", { length: 128 }).notNull(), // e.g., "Punjab History", "Geography"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

/**
 * Player quiz performance table - tracks quiz answers
 */
export const playerQuizPerformance = mysqlTable("playerQuizPerformance", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  questionId: varchar("questionId", { length: 64 }).notNull(),
  answered: boolean("answered").default(false).notNull(),
  selectedAnswer: int("selectedAnswer"),
  isCorrect: boolean("isCorrect").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerQuizPerformance = typeof playerQuizPerformance.$inferSelect;
export type InsertPlayerQuizPerformance = typeof playerQuizPerformance.$inferInsert;
