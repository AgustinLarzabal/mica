import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

export const issuers = pgTable(
  "issuers",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 200 }).notNull(),
    code: varchar({ length: 12 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("issuers_code_unique").on(table.code),
    check("issuers_name_not_empty", sql`length(${table.name}) >= 1`),
    check(
      "issuers_name_trimmed",
      sql`${table.name} !~ '^[[:space:]]|[[:space:]]$'`
    ),
    check(
      "issuers_code_format",
      sql`${table.code} ~ '^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$'`
    ),
  ]
)

export const issuerRecordSchema = createSelectSchema(issuers)
export type IssuerRecord = z.infer<typeof issuerRecordSchema>

export const issuerSeedRecordSchema = createInsertSchema(issuers, {
  name: (schema) =>
    schema
      .min(1)
      .max(200)
      .refine((name) => name === name.trim(), "Issuer name must be trimmed"),
  code: (schema) =>
    schema.regex(
      /^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/,
      "Issuer Code must be two uppercase ASCII letters or an Archive-defined 3–12 character code"
    ),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required()
  .strict()
