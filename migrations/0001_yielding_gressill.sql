PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_relations` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "no_todo_todo_relation" CHECK(NOT (source_type = 'todo' AND target_type = 'todo'))
);
--> statement-breakpoint
DELETE FROM `relations` WHERE `source_type` = 'todo' AND `target_type` = 'todo';--> statement-breakpoint
INSERT INTO `__new_relations`("id", "source_type", "source_id", "target_type", "target_id", "created_at") SELECT "id", "source_type", "source_id", "target_type", "target_id", "created_at" FROM `relations`;--> statement-breakpoint
DROP TABLE `relations`;--> statement-breakpoint
ALTER TABLE `__new_relations` RENAME TO `relations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `relations_pair_unique` ON `relations` (`source_type`,`source_id`,`target_type`,`target_id`);