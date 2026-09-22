import { sql } from "drizzle-orm"
import { check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { issuers } from "./issuer.js"
import type { z } from "zod"

export const coins = pgTable(
  "coins",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 200 }).notNull(),
    issuerId: uuid("issuer_id")
      .notNull()
      .references(() => issuers.id, { onDelete: "restrict" }),
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
export type CoinRecord = z.infer<typeof coinRecordSchema>

const varcharIssuerCodeSchema = createInsertSchema(issuers).pick({ code: true })
  .shape.code

export const coinSeedRecordSchema = createInsertSchema(coins, {
  title: (schema) =>
    schema
      .min(1)
      .refine((title) => title === title.trim(), "Coin title must be trimmed"),
})
  .omit({ issuerId: true, createdAt: true, updatedAt: true })
  .extend({ issuerCode: varcharIssuerCodeSchema })
  .required()
  .strict()
