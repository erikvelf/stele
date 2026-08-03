CREATE TABLE `day_highlight_position` (
	`highlight_id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`highlight_id`) REFERENCES `day_highlight`(`id`) ON UPDATE no action ON DELETE cascade
);
