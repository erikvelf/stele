CREATE TABLE `reflection` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`period_start` integer NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reflection_kind_period_start` ON `reflection` (`kind`,`period_start`);