CREATE TABLE `aiUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOptionId` int,
	`isCorrect` boolean NOT NULL,
	`confidence` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disciplineId` int NOT NULL,
	`themeId` int,
	`slug` varchar(160) NOT NULL,
	`title` varchar(240) NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`difficulty` enum('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
	`estimatedMinutes` int NOT NULL DEFAULT 15,
	`objectives` json NOT NULL,
	`references` json NOT NULL,
	`origin` enum('authorial','external','official','ai','editorReviewed') NOT NULL DEFAULT 'authorial',
	`reviewStatus` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `contentItems_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `disciplines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`area` enum('languages','writing','humanities','nature','mathematics') NOT NULL,
	`description` text NOT NULL,
	`color` varchar(16) NOT NULL,
	`icon` varchar(48) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disciplines_id` PRIMARY KEY(`id`),
	CONSTRAINT `disciplines_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `errorNotebook` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`errorType` enum('concept','attention','strategy','interpretation','other') NOT NULL DEFAULT 'concept',
	`note` text,
	`confidence` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`mastery` int NOT NULL DEFAULT 0,
	`nextReviewAt` date NOT NULL,
	`reviewIntervalDays` int NOT NULL DEFAULT 1,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `errorNotebook_id` PRIMARY KEY(`id`),
	CONSTRAINT `notebook_user_question_unique` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `essayPrompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(260) NOT NULL,
	`briefing` text NOT NULL,
	`collection` text NOT NULL,
	`source` varchar(200) NOT NULL,
	`origin` enum('authorial','official','external') NOT NULL DEFAULT 'authorial',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `essayPrompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `essayVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`essayId` int NOT NULL,
	`body` text NOT NULL,
	`wordCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `essayVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `essays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promptId` int,
	`title` varchar(260) NOT NULL,
	`body` text NOT NULL,
	`wordCount` int NOT NULL DEFAULT 0,
	`lineEstimate` int NOT NULL DEFAULT 0,
	`checklist` json NOT NULL,
	`status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `essays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('content','video','question') NOT NULL,
	`entityId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_entity_unique` UNIQUE(`userId`,`entityType`,`entityId`)
);
--> statement-breakpoint
CREATE TABLE `mockAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOptionId` int,
	`markedForReview` boolean NOT NULL DEFAULT false,
	`isCorrect` boolean,
	CONSTRAINT `mockAnswers_id` PRIMARY KEY(`id`),
	CONSTRAINT `mock_answer_unique` UNIQUE(`sessionId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `mockQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mockId` int NOT NULL,
	`questionId` int NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `mockQuestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `mock_question_position_unique` UNIQUE(`mockId`,`position`),
	CONSTRAINT `mock_question_unique` UNIQUE(`mockId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `mockSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mockId` int,
	`area` enum('mixed','languages','humanities','nature','mathematics') NOT NULL DEFAULT 'mixed',
	`durationMinutes` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`scoreCorrect` int NOT NULL DEFAULT 0,
	`scoreTotal` int NOT NULL DEFAULT 0,
	`status` enum('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
	CONSTRAINT `mockSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`area` enum('mixed','languages','humanities','nature','mathematics') NOT NULL DEFAULT 'mixed',
	`durationMinutes` int NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120),
	`weeklyGoalMinutes` int NOT NULL DEFAULT 600,
	`availableMinutesPerDay` int NOT NULL DEFAULT 120,
	`studyDays` json NOT NULL,
	`difficultSubjects` json NOT NULL,
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `questionOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`optionKey` varchar(1) NOT NULL,
	`text` text NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	CONSTRAINT `questionOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `question_option_unique` UNIQUE(`questionId`,`optionKey`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disciplineId` int NOT NULL,
	`themeId` int,
	`stem` text NOT NULL,
	`explanation` text NOT NULL,
	`incorrectExplanations` json NOT NULL,
	`difficulty` enum('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
	`year` int,
	`skillCode` varchar(32),
	`source` varchar(160) NOT NULL,
	`questionType` varchar(64) NOT NULL DEFAULT 'multiple_choice',
	`origin` enum('authorial','official','external','ai') NOT NULL DEFAULT 'authorial',
	`reviewStatus` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`query` varchar(240) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`minutes` int NOT NULL DEFAULT 0,
	`referenceType` varchar(64),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL DEFAULT 'Rota de 31 dias',
	`startDate` date NOT NULL,
	`examDayOne` date,
	`examDayTwo` date,
	`availableMinutesPerDay` int NOT NULL,
	`studyDays` json NOT NULL,
	`difficultSubjects` json NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studyPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`disciplineId` int,
	`contentId` int,
	`dayNumber` int NOT NULL,
	`phase` enum('diagnostic','consolidation','practice','revision','mock','final') NOT NULL,
	`title` varchar(240) NOT NULL,
	`objective` text NOT NULL,
	`didacticSummary` text NOT NULL,
	`concepts` json NOT NULL,
	`estimatedMinutes` int NOT NULL,
	`difficulty` enum('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
	`scheduledFor` date NOT NULL,
	`reviewOfDay` int,
	`status` enum('todo','done','skipped') NOT NULL DEFAULT 'todo',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_plan_day_unique` UNIQUE(`planId`,`dayNumber`)
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disciplineId` int NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`skillCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `themes_id` PRIMARY KEY(`id`),
	CONSTRAINT `themes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `videoProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`lastWatchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `video_progress_unique` UNIQUE(`userId`,`videoId`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disciplineId` int NOT NULL,
	`themeId` int,
	`title` varchar(255) NOT NULL,
	`url` varchar(1200) NOT NULL,
	`channel` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`durationSeconds` int,
	`source` varchar(255) NOT NULL,
	`verifiedAt` timestamp,
	`availability` enum('verified','pending','unavailable') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `aiUsage` ADD CONSTRAINT `aiUsage_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_selectedOptionId_questionOptions_id_fk` FOREIGN KEY (`selectedOptionId`) REFERENCES `questionOptions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentItems` ADD CONSTRAINT `contentItems_disciplineId_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `disciplines`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentItems` ADD CONSTRAINT `contentItems_themeId_themes_id_fk` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `errorNotebook` ADD CONSTRAINT `errorNotebook_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `errorNotebook` ADD CONSTRAINT `errorNotebook_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `essayVersions` ADD CONSTRAINT `essayVersions_essayId_essays_id_fk` FOREIGN KEY (`essayId`) REFERENCES `essays`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `essays` ADD CONSTRAINT `essays_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `essays` ADD CONSTRAINT `essays_promptId_essayPrompts_id_fk` FOREIGN KEY (`promptId`) REFERENCES `essayPrompts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockAnswers` ADD CONSTRAINT `mockAnswers_sessionId_mockSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `mockSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockAnswers` ADD CONSTRAINT `mockAnswers_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockAnswers` ADD CONSTRAINT `mockAnswers_selectedOptionId_questionOptions_id_fk` FOREIGN KEY (`selectedOptionId`) REFERENCES `questionOptions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockQuestions` ADD CONSTRAINT `mockQuestions_mockId_mocks_id_fk` FOREIGN KEY (`mockId`) REFERENCES `mocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockQuestions` ADD CONSTRAINT `mockQuestions_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockSessions` ADD CONSTRAINT `mockSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mockSessions` ADD CONSTRAINT `mockSessions_mockId_mocks_id_fk` FOREIGN KEY (`mockId`) REFERENCES `mocks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questionOptions` ADD CONSTRAINT `questionOptions_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_disciplineId_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `disciplines`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_themeId_themes_id_fk` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `searchHistory` ADD CONSTRAINT `searchHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyEvents` ADD CONSTRAINT `studyEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyPlans` ADD CONSTRAINT `studyPlans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyTasks` ADD CONSTRAINT `studyTasks_planId_studyPlans_id_fk` FOREIGN KEY (`planId`) REFERENCES `studyPlans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyTasks` ADD CONSTRAINT `studyTasks_disciplineId_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `disciplines`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyTasks` ADD CONSTRAINT `studyTasks_contentId_contentItems_id_fk` FOREIGN KEY (`contentId`) REFERENCES `contentItems`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `themes` ADD CONSTRAINT `themes_disciplineId_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `disciplines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoProgress` ADD CONSTRAINT `videoProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoProgress` ADD CONSTRAINT `videoProgress_videoId_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_disciplineId_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `disciplines`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_themeId_themes_id_fk` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_usage_daily_idx` ON `aiUsage` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `attempts_user_question_idx` ON `attempts` (`userId`,`questionId`);--> statement-breakpoint
CREATE INDEX `attempts_user_created_idx` ON `attempts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_action_created_idx` ON `auditLogs` (`action`,`createdAt`);--> statement-breakpoint
CREATE INDEX `contents_catalog_idx` ON `contentItems` (`disciplineId`,`themeId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `contents_updated_idx` ON `contentItems` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `disciplines_area_idx` ON `disciplines` (`area`);--> statement-breakpoint
CREATE INDEX `notebook_due_idx` ON `errorNotebook` (`userId`,`nextReviewAt`);--> statement-breakpoint
CREATE INDEX `essay_prompts_active_idx` ON `essayPrompts` (`active`);--> statement-breakpoint
CREATE INDEX `essay_versions_essay_idx` ON `essayVersions` (`essayId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `essays_user_status_idx` ON `essays` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `mock_sessions_user_idx` ON `mockSessions` (`userId`,`status`,`startedAt`);--> statement-breakpoint
CREATE INDEX `mocks_published_idx` ON `mocks` (`isPublished`,`area`);--> statement-breakpoint
CREATE INDEX `profiles_user_idx` ON `profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `questions_filter_idx` ON `questions` (`disciplineId`,`themeId`,`difficulty`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `questions_source_year_idx` ON `questions` (`source`,`year`);--> statement-breakpoint
CREATE INDEX `search_history_user_created_idx` ON `searchHistory` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `study_events_user_created_idx` ON `studyEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `plans_user_status_idx` ON `studyPlans` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_today_idx` ON `studyTasks` (`planId`,`scheduledFor`,`status`);--> statement-breakpoint
CREATE INDEX `themes_discipline_idx` ON `themes` (`disciplineId`);--> statement-breakpoint
CREATE INDEX `videos_catalog_idx` ON `videos` (`disciplineId`,`themeId`,`availability`);--> statement-breakpoint
CREATE INDEX `users_role_status_idx` ON `users` (`role`,`status`);