CREATE TABLE `folder` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`emoji` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `day_highlight_position` (
	`highlight_id` text PRIMARY KEY NOT NULL,
	`journal_note_id` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`highlight_id`) REFERENCES `day_highlight`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `day_highlight` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_note_id` text NOT NULL,
	`text` text NOT NULL,
	`tag_id` text,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);--> statement-breakpoint
CREATE TABLE `journal_note` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	`start_timestamp` integer NOT NULL,
	`end_timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`folder_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folder`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reflection` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`period_start` integer NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reflection_kind_period_start` ON `reflection` (`kind`,`period_start`);