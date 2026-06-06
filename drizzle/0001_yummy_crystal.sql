CREATE TABLE `gameSessions` (
	`id` varchar(64) NOT NULL,
	`playerId` int NOT NULL,
	`opponentId` int,
	`gameMode` enum('1v1_direct_war','territory_capture','quiz_war') NOT NULL,
	`playerDistrict` enum('okara','sahiwal') NOT NULL,
	`opponentDistrict` enum('okara','sahiwal'),
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`winner` int,
	`playerScore` int NOT NULL DEFAULT 0,
	`opponentScore` int DEFAULT 0,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `heroes` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`district` enum('okara','sahiwal') NOT NULL,
	`description` text,
	`specialMove` varchar(256) NOT NULL,
	`baseHealth` int NOT NULL DEFAULT 100,
	`baseAttack` int NOT NULL DEFAULT 20,
	`baseSpeed` int NOT NULL DEFAULT 10,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `heroes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`district` enum('okara','sahiwal') NOT NULL,
	`rank` int NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`winRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`funnyTitle` varchar(256) NOT NULL DEFAULT 'Novice Warrior',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`),
	CONSTRAINT `leaderboard_playerId_unique` UNIQUE(`playerId`)
);
--> statement-breakpoint
CREATE TABLE `playerQuizPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`questionId` varchar(64) NOT NULL,
	`answered` boolean NOT NULL DEFAULT false,
	`selectedAnswer` int,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playerQuizPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`district` enum('okara','sahiwal') NOT NULL,
	`lives` int NOT NULL DEFAULT 1,
	`totalWins` int NOT NULL DEFAULT 0,
	`totalLosses` int NOT NULL DEFAULT 0,
	`unlockedHeroes` text NOT NULL DEFAULT ('[]'),
	`selectedHero` varchar(64),
	`totalGamesPlayed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` varchar(64) NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`correctAnswer` int NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`topic` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`district` enum('okara','sahiwal') NOT NULL,
	`type` varchar(64) NOT NULL,
	`baseHealth` int NOT NULL DEFAULT 50,
	`baseAttack` int NOT NULL DEFAULT 15,
	`baseSpeed` int NOT NULL DEFAULT 5,
	`cost` int NOT NULL DEFAULT 100,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
