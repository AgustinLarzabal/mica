import { z } from "zod"

export const operationalOkResponseSchema = z.strictObject({
  status: z.literal("ok"),
})

export type OperationalOkResponse = z.infer<typeof operationalOkResponseSchema>

export const operationalUnavailableResponseSchema = z.strictObject({
  status: z.literal("unavailable"),
})

export type OperationalUnavailableResponse = z.infer<
  typeof operationalUnavailableResponseSchema
>

export const coinIdSchema = z.uuid()

export const issuerResponseSchema = z.strictObject({
  name: z.string().min(1).max(200),
  code: z.string().regex(/^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/),
})

export type IssuerResponse = z.infer<typeof issuerResponseSchema>

export const coinResponseSchema = z.strictObject({
  id: coinIdSchema,
  title: z.string().min(1).max(200),
  issuer: issuerResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type CoinResponse = z.infer<typeof coinResponseSchema>

export const coinListResponseSchema = z.strictObject({
  coins: z.array(coinResponseSchema),
})

export type CoinListResponse = z.infer<typeof coinListResponseSchema>

function errorResponseSchema<
  const TCode extends string,
  const TMessage extends string,
>(code: TCode, message: TMessage) {
  return z.object({
    error: z.object({
      code: z.literal(code),
      message: z.literal(message),
    }),
  })
}

export const invalidCoinIdErrorSchema = errorResponseSchema(
  "invalid_coin_id",
  "Coin ID must be a valid UUID"
)

export const coinNotFoundErrorSchema = errorResponseSchema(
  "coin_not_found",
  "Coin not found"
)

export const internalErrorSchema = errorResponseSchema(
  "internal_error",
  "Internal server error"
)
