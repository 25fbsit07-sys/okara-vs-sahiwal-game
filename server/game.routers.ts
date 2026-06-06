import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";

/**
 * Game routers for Okara vs Sahiwal game
 * Handles players, heroes, game modes, and leaderboard
 */

// Validation schemas
const districtSchema = z.enum(["okara", "sahiwal"]);
const gameModeSchema = z.enum(["1v1_direct_war", "territory_capture", "quiz_war"]);

// Default heroes data
const DEFAULT_HEROES = [
  {
    id: "chaudhry-gehun-khan",
    name: "Chaudhry Gehun Khan",
    district: "okara" as const,
    description: "Wheat farmer general",
    specialMove: "Harri season — floods battlefield with crop",
    baseHealth: 120,
    baseAttack: 25,
    baseSpeed: 12,
    rarity: "epic" as const,
  },
  {
    id: "colonel-sarson",
    name: "Colonel Sarson",
    district: "okara" as const,
    description: "Mustard oil strategist",
    specialMove: "Spreads oil on ground, enemy soldiers fall comically",
    baseHealth: 100,
    baseAttack: 20,
    baseSpeed: 10,
    rarity: "rare" as const,
  },
  {
    id: "billi-bibi-buffalo-rani",
    name: "Billi Bibi Buffalo Rani",
    district: "sahiwal" as const,
    description: "Dairy queen riding a prize Sahiwal cow",
    specialMove: "Throws dahi (yogurt) grenades",
    baseHealth: 110,
    baseAttack: 22,
    baseSpeed: 11,
    rarity: "epic" as const,
  },
  {
    id: "doodh-wala-doom",
    name: "Doodh Wala Doom",
    district: "sahiwal" as const,
    description: "Milkman turned general",
    specialMove: "Arrives on bicycle at 5am, wakes enemy camp",
    baseHealth: 95,
    baseAttack: 18,
    baseSpeed: 14,
    rarity: "rare" as const,
  },
];

// Default units data
const DEFAULT_UNITS = [
  // Okara units
  {
    id: "roti-catapult",
    name: "Roti Catapult",
    district: "okara" as const,
    type: "ranged",
    baseHealth: 60,
    baseAttack: 20,
    baseSpeed: 4,
    cost: 100,
    description: "Launches flying rotis at enemies",
  },
  {
    id: "tractor-rush",
    name: "Tractor Rush",
    district: "okara" as const,
    type: "melee",
    baseHealth: 80,
    baseAttack: 25,
    baseSpeed: 8,
    cost: 150,
    description: "Heavy tractor unit that plows through enemies",
  },
  {
    id: "wheat-cloud",
    name: "Wheat Cloud",
    district: "okara" as const,
    type: "support",
    baseHealth: 40,
    baseAttack: 5,
    baseSpeed: 12,
    cost: 80,
    description: "Provides cover and support to allies",
  },
  // Sahiwal units
  {
    id: "lassi-bomb",
    name: "Lassi Bomb",
    district: "sahiwal" as const,
    type: "ranged",
    baseHealth: 55,
    baseAttack: 22,
    baseSpeed: 6,
    cost: 110,
    description: "Explosive lassi projectiles",
  },
  {
    id: "buffalo-stampede",
    name: "Buffalo Stampede",
    district: "sahiwal" as const,
    type: "melee",
    baseHealth: 85,
    baseAttack: 28,
    baseSpeed: 7,
    cost: 160,
    description: "Charging buffalo unit with massive impact",
  },
  {
    id: "doodh-cannon",
    name: "Doodh Cannon",
    district: "sahiwal" as const,
    type: "support",
    baseHealth: 45,
    baseAttack: 8,
    baseSpeed: 3,
    cost: 120,
    description: "Stationary cannon that shoots milk streams",
  },
];

// Default quiz questions
const DEFAULT_QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What is the capital of Punjab?",
    options: JSON.stringify(["Lahore", "Islamabad", "Karachi", "Peshawar"]),
    correctAnswer: 0,
    difficulty: "easy" as const,
    topic: "Geography",
  },
  {
    id: "q2",
    question: "Which river flows through Okara?",
    options: JSON.stringify(["Sutlej", "Ravi", "Chenab", "Jhelum"]),
    correctAnswer: 1,
    difficulty: "medium" as const,
    topic: "Geography",
  },
  {
    id: "q3",
    question: "What is Sahiwal known for?",
    options: JSON.stringify(["Wheat production", "Dairy farming", "Cotton mills", "Steel industry"]),
    correctAnswer: 1,
    difficulty: "easy" as const,
    topic: "Geography",
  },
  {
    id: "q4",
    question: "In which province is Okara located?",
    options: JSON.stringify(["Punjab", "Sindh", "KPK", "Balochistan"]),
    correctAnswer: 0,
    difficulty: "easy" as const,
    topic: "Geography",
  },
  {
    id: "q5",
    question: "What is the main occupation in Okara?",
    options: JSON.stringify(["Farming", "Fishing", "Mining", "Tourism"]),
    correctAnswer: 0,
    difficulty: "medium" as const,
    topic: "Geography",
  },
];

export const gameRouter = router({
  // Player routes
  players: router({
    /**
     * Get or create player profile
     */
    getOrCreate: protectedProcedure
      .input(z.object({
        district: districtSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        try {
          let player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            player = await db.getOrCreatePlayer(userId, input.district);
          }
          
          if (!player) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create player profile",
            });
          }

          return {
            id: player.id,
            userId: player.userId,
            district: player.district,
            lives: player.lives,
            totalWins: player.totalWins,
            totalLosses: player.totalLosses,
            unlockedHeroes: JSON.parse(player.unlockedHeroes || "[]"),
            selectedHero: player.selectedHero,
            totalGamesPlayed: player.totalGamesPlayed,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
          };
        } catch (error) {
          console.error("Error in getOrCreate:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get or create player",
          });
        }
      }),

    /**
     * Get player profile
     */
    getProfile: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        
        try {
          const player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Player profile not found",
            });
          }

          return {
            id: player.id,
            userId: player.userId,
            district: player.district,
            lives: player.lives,
            totalWins: player.totalWins,
            totalLosses: player.totalLosses,
            unlockedHeroes: JSON.parse(player.unlockedHeroes || "[]"),
            selectedHero: player.selectedHero,
            totalGamesPlayed: player.totalGamesPlayed,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
          };
        } catch (error) {
          console.error("Error in getProfile:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch player profile",
          });
        }
      }),

    /**
     * Update player district selection
     */
    updateDistrict: protectedProcedure
      .input(z.object({
        district: districtSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        try {
          const success = await db.updatePlayerDistrict(userId, input.district);
          
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update district",
            });
          }

          return {
            success: true,
            district: input.district,
          };
        } catch (error) {
          console.error("Error in updateDistrict:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update district",
          });
        }
      }),

    /**
     * Award life to player on login
     */
    awardLife: protectedProcedure
      .mutation(async ({ ctx }) => {
        const userId = ctx.user.id;
        
        try {
          const success = await db.awardLifeToPlayer(userId);
          
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to award life",
            });
          }

          const player = await db.getPlayerByUserId(userId);
          
          return {
            success: true,
            livesAwarded: 1,
            totalLives: player?.lives || 1,
          };
        } catch (error) {
          console.error("Error in awardLife:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to award life",
          });
        }
      }),
  }),

  // Hero routes
  heroes: router({
    /**
     * Get all heroes
     */
    getAll: publicProcedure
      .query(async () => {
        try {
          const heroes = await db.getAllHeroes();
          
          if (heroes.length === 0) {
            // Return default heroes if database is empty
            return DEFAULT_HEROES;
          }

          return heroes.map(h => ({
            id: h.id,
            name: h.name,
            district: h.district,
            description: h.description,
            specialMove: h.specialMove,
            baseHealth: h.baseHealth,
            baseAttack: h.baseAttack,
            baseSpeed: h.baseSpeed,
            rarity: h.rarity,
          }));
        } catch (error) {
          console.error("Error in getAll heroes:", error);
          return DEFAULT_HEROES;
        }
      }),

    /**
     * Get heroes by district
     */
    getByDistrict: publicProcedure
      .input(z.object({
        district: districtSchema,
      }))
      .query(async ({ input }) => {
        try {
          const heroes = await db.getHeroesByDistrict(input.district);
          
          if (heroes.length === 0) {
            // Return default heroes for this district
            return DEFAULT_HEROES.filter(h => h.district === input.district);
          }

          return heroes.map(h => ({
            id: h.id,
            name: h.name,
            district: h.district,
            description: h.description,
            specialMove: h.specialMove,
            baseHealth: h.baseHealth,
            baseAttack: h.baseAttack,
            baseSpeed: h.baseSpeed,
            rarity: h.rarity,
          }));
        } catch (error) {
          console.error("Error in getByDistrict:", error);
          return DEFAULT_HEROES.filter(h => h.district === input.district);
        }
      }),

    /**
     * Select hero for player
     */
    selectHero: protectedProcedure
      .input(z.object({
        heroId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        try {
          const success = await db.updatePlayerHero(userId, input.heroId);
          
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to select hero",
            });
          }

          return {
            success: true,
            selectedHero: input.heroId,
          };
        } catch (error) {
          console.error("Error in selectHero:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to select hero",
          });
        }
      }),
  }),

  // Game modes
  gameModes: router({
    /**
     * Start a new game session
     */
    startGame: protectedProcedure
      .input(z.object({
        gameMode: gameModeSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        try {
          const player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Player profile not found",
            });
          }

          if (player.lives <= 0) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Not enough lives to start a game",
            });
          }

          const sessionId = nanoid();
          const session = await db.createGameSession({
            id: sessionId,
            playerId: player.id,
            gameMode: input.gameMode,
            playerDistrict: player.district,
            status: "active",
            playerScore: 0,
          });

          if (!session) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create game session",
            });
          }

          return {
            success: true,
            gameSessionId: sessionId,
            gameMode: input.gameMode,
          };
        } catch (error) {
          console.error("Error in startGame:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to start game",
          });
        }
      }),

    /**
     * Get active game session
     */
    getActiveSession: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        
        try {
          const player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            return null;
          }

          const session = await db.getActiveGameSession(player.id);
          
          if (!session) {
            return null;
          }

          return {
            id: session.id,
            gameMode: session.gameMode,
            playerDistrict: session.playerDistrict,
            playerScore: session.playerScore,
            status: session.status,
          };
        } catch (error) {
          console.error("Error in getActiveSession:", error);
          return null;
        }
      }),

    /**
     * End game session
     */
    endGame: protectedProcedure
      .input(z.object({
        gameSessionId: z.string(),
        playerScore: z.number(),
        opponentScore: z.number().optional(),
        winner: z.enum(["player", "opponent", "draw"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        try {
          const player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Player profile not found",
            });
          }

          const session = await db.getGameSessionById(input.gameSessionId);
          
          if (!session) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Game session not found",
            });
          }

          if (session.playerId !== player.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not the owner of this session",
            });
          }

          let winnerId = null;
          if (input.winner === "player") {
            winnerId = player.id;
          }

          const success = await db.endGameSession(
            input.gameSessionId,
            winnerId,
            input.playerScore,
            input.opponentScore || 0
          );

          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to end game session",
            });
          }

          // Update leaderboard
          await db.updateLeaderboard(player.id);

          return {
            success: true,
            message: "Game ended successfully",
          };
        } catch (error) {
          console.error("Error in endGame:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to end game",
          });
        }
      }),

    /**
     * Get units for a district
     */
    getUnits: publicProcedure
      .input(z.object({
        district: districtSchema.optional(),
      }))
      .query(async ({ input }) => {
        try {
          if (input.district) {
            const units = await db.getUnitsByDistrict(input.district);
            
            if (units.length === 0) {
              return DEFAULT_UNITS.filter(u => u.district === input.district);
            }

            return units.map(u => ({
              id: u.id,
              name: u.name,
              district: u.district,
              type: u.type,
              baseHealth: u.baseHealth,
              baseAttack: u.baseAttack,
              baseSpeed: u.baseSpeed,
              cost: u.cost,
              description: u.description,
            }));
          } else {
            const units = await db.getAllUnits();
            
            if (units.length === 0) {
              return DEFAULT_UNITS;
            }

            return units.map(u => ({
              id: u.id,
              name: u.name,
              district: u.district,
              type: u.type,
              baseHealth: u.baseHealth,
              baseAttack: u.baseAttack,
              baseSpeed: u.baseSpeed,
              cost: u.cost,
              description: u.description,
            }));
          }
        } catch (error) {
          console.error("Error in getUnits:", error);
          return input.district 
            ? DEFAULT_UNITS.filter(u => u.district === input.district)
            : DEFAULT_UNITS;
        }
      }),
  }),

  // Leaderboard
  leaderboard: router({
    /**
     * Get leaderboard by district
     */
    getByDistrict: publicProcedure
      .input(z.object({
        district: districtSchema,
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        try {
          const leaderboardData = await db.getLeaderboardByDistrict(input.district, input.limit);
          
          return leaderboardData.map((entry, index) => ({
            rank: index + 1,
            playerId: entry.playerId,
            district: entry.district,
            wins: entry.wins,
            losses: entry.losses,
            winRate: parseFloat(entry.winRate),
            funnyTitle: entry.funnyTitle,
          }));
        } catch (error) {
          console.error("Error in getByDistrict:", error);
          return [];
        }
      }),

    /**
     * Get player's rank
     */
    getPlayerRank: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        
        try {
          const player = await db.getPlayerByUserId(userId);
          
          if (!player) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Player profile not found",
            });
          }

          const rank = await db.getPlayerLeaderboardRank(player.id);
          
          if (!rank) {
            return {
              rank: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              funnyTitle: "Novice Warrior",
            };
          }

          return {
            rank: rank.rank,
            wins: rank.wins,
            losses: rank.losses,
            winRate: parseFloat(rank.winRate),
            funnyTitle: rank.funnyTitle,
          };
        } catch (error) {
          console.error("Error in getPlayerRank:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch player rank",
          });
        }
      }),
  }),

  // Quiz mode
  quiz: router({
    /**
     * Get random quiz questions
     */
    getQuestions: publicProcedure
      .input(z.object({
        count: z.number().default(5),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const questions = await db.getRandomQuizQuestions(input.count, input.difficulty);
          
          if (questions.length === 0) {
            return DEFAULT_QUIZ_QUESTIONS.slice(0, input.count).map(q => ({
              id: q.id,
              question: q.question,
              options: JSON.parse(q.options),
              difficulty: q.difficulty,
              topic: q.topic,
            }));
          }

          return questions.map(q => ({
            id: q.id,
            question: q.question,
            options: JSON.parse(q.options),
            difficulty: q.difficulty,
            topic: q.topic,
          }));
        } catch (error) {
          console.error("Error in getQuestions:", error);
          return DEFAULT_QUIZ_QUESTIONS.slice(0, input.count).map(q => ({
            id: q.id,
            question: q.question,
            options: JSON.parse(q.options),
            difficulty: q.difficulty,
            topic: q.topic,
          }));
        }
      }),

    /**
     * Submit quiz answer
     */
    submitAnswer: protectedProcedure
      .input(z.object({
        questionId: z.string(),
        selectedAnswer: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Find the question in default questions
          const question = DEFAULT_QUIZ_QUESTIONS.find(q => q.id === input.questionId);
          
          if (!question) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Question not found",
            });
          }

          const isCorrect = question.correctAnswer === input.selectedAnswer;
          const pointsAwarded = isCorrect ? 10 : 0;

          return {
            correct: isCorrect,
            pointsAwarded,
          };
        } catch (error) {
          console.error("Error in submitAnswer:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to submit answer",
          });
        }
      }),
  }),
});

export type GameRouter = typeof gameRouter;
