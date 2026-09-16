CREATE TABLE "coins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coins_title_not_empty" CHECK (length("coins"."title") >= 1),
	CONSTRAINT "coins_title_trimmed" CHECK ("coins"."title" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
CREATE FUNCTION set_coin_updated_at() RETURNS trigger AS $$
BEGIN
	NEW.updated_at = clock_timestamp();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER coins_set_updated_at
BEFORE UPDATE ON "coins"
FOR EACH ROW
EXECUTE FUNCTION set_coin_updated_at();
