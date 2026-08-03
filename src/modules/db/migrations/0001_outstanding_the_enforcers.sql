DROP TABLE `day_highlight_tag`;--> statement-breakpoint
ALTER TABLE `day_highlight` ADD `tag_id` text REFERENCES tag(id);