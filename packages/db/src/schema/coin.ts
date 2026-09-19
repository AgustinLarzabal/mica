import { sql } from "drizzle-orm"
import { check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

export const coins = pgTable(
  "coins",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("coins_title_not_empty", sql`length(${table.title}) >= 1`),
    check(
      "coins_title_trimmed",
      sql`${table.title} !~ '^[[:space:]]|[[:space:]]$'`
    ),
  ]
)

export const coinRecordSchema = createSelectSchema(coins)
export type Coin = z.infer<typeof coinRecordSchema>

export const coinSeedRecordSchema = createInsertSchema(coins, {
  title: (schema) =>
    schema
      .min(1)
      .refine((title) => title === title.trim(), "Coin title must be trimmed"),
})
  .omit({ createdAt: true, updatedAt: true })
  .required()
  .strict()
