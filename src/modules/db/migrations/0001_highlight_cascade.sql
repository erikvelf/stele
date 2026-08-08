PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_day_highlight` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_note_id` text NOT NULL,
	`text` text NOT NULL,
	`tag_id` text,
	FOREIGN KEY (`journal_note_id`) REFERENCES `journal_note`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_day_highlight`("id", "journal_note_id", "text", "tag_id") SELECT "id", "journal_note_id", "text", "tag_id" FROM `day_highlight`;--> statement-breakpoint
DROP TABLE `day_highlight`;--> statement-breakpoint
ALTER TABLE `__new_day_highlight` RENAME TO `day_highlight`;--> statement-breakpoint
PRAGMA foreign_keys=ON;