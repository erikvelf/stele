CREATE TABLE `folder` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`emoji` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `day_highlight` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `day_highlight_tag` (
	`day_highlight_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`day_highlight_id`, `tag_id`),
	FOREIGN KEY (`day_highlight_id`) REFERENCES `day_highlight`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);--> statement-breakpoint
CREATE TABLE `date_day_range` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`start_timestamp` integer NOT NULL,
	`end_timestamp` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `note`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `date_day_range_note_id_unique` ON `date_day_range` (`note_id`);--> statement-breakpoint
CREATE TABLE `note_folder` (
	`note_id` text PRIMARY KEY NOT NULL,
	`folder_id` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `note`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL
);
