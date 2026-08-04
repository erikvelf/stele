CREATE TABLE `note_created` (
	`note_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `note`(`id`) ON UPDATE no action ON DELETE no action
);
