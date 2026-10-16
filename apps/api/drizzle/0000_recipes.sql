CREATE TABLE `ingredient_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ingredient_groups_recipe` ON `ingredient_groups` (`recipe_id`,`position`);--> statement-breakpoint
CREATE TABLE `ingredient_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`position` integer NOT NULL,
	`amount` real,
	`unit` text,
	`food` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`original` text DEFAULT '' NOT NULL,
	`flavors` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `ingredient_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ingredient_lines_group` ON `ingredient_lines` (`group_id`,`position`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`servings` integer NOT NULL,
	`time_minutes` integer,
	`serving_kind` text DEFAULT 'share' NOT NULL,
	`serving_grams` real,
	`serving_pieces` integer,
	`finished_weight_grams` real,
	`taste` integer,
	`difficulty` text,
	`price` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "serving_kind_valid" CHECK("recipes"."serving_kind" in ('share', 'weight', 'pieces'))
);
--> statement-breakpoint
CREATE INDEX `recipes_updated_at` ON `recipes` (`updated_at`);--> statement-breakpoint
CREATE TABLE `steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	`timer_seconds` integer,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `steps_recipe` ON `steps` (`recipe_id`,`position`);