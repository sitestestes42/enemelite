CREATE TABLE `examConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`edition` varchar(32) NOT NULL,
	`examDayOne` date NOT NULL,
	`examDayTwo` date NOT NULL,
	`sourceUrl` varchar(1200) NOT NULL,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examConfigurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `examConfigurations_edition_unique` UNIQUE(`edition`)
);
--> statement-breakpoint
ALTER TABLE `contentItems` MODIFY COLUMN `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `examConfigurations` ADD CONSTRAINT `examConfigurations_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exam_config_updated_idx` ON `examConfigurations` (`updatedAt`);