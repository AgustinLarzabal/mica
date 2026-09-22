CREATE TABLE "issuers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issuers_code_unique" UNIQUE("code"),
	CONSTRAINT "issuers_name_not_empty" CHECK (length("issuers"."name") >= 1),
	CONSTRAINT "issuers_name_trimmed" CHECK ("issuers"."name" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "issuers_code_format" CHECK ("issuers"."code" ~ '^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$')
);
--> statement-breakpoint
CREATE FUNCTION set_issuer_updated_at() RETURNS trigger AS $$
BEGIN
	NEW.updated_at = clock_timestamp();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER issuers_set_updated_at
BEFORE UPDATE ON "issuers"
FOR EACH ROW
EXECUTE FUNCTION set_issuer_updated_at();
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "issuer_id" uuid;--> statement-breakpoint
ALTER TABLE "coins" ALTER COLUMN "issuer_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_issuer_id_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuers"("id") ON DELETE restrict ON UPDATE no action;
