import { z } from "zod"

const originSchema = z.string().superRefine((value, context) => {
  if (value === "*") {
    context.addIssue({
      code: "custom",
      message: "wildcard origins are not allowed",
    })
    return
  }

  try {
    const url = new URL(value)
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== value
    ) {
      throw new Error("not an HTTP origin")
    }
  } catch {
    context.addIssue({
      code: "custom",
      message: "must be an HTTP or HTTPS origin without a path",
    })
  }
})

const databaseUrlSchema = z.string().superRefine((value, context) => {
  try {
    const url = new URL(value)
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("not a PostgreSQL URL")
    }
  } catch {
    context.addIssue({
      code: "custom",
      message: "must be a valid PostgreSQL connection URL",
    })
  }
})

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  API_ALLOWED_ORIGINS: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.split(",").map((origin) => origin.trim()))
    .pipe(z.array(originSchema).min(1)),
  DATABASE_URL: databaseUrlSchema,
})

export interface ApiConfig {
  allowedOrigins: Array<string>
  databaseUrl: string
  port: number
}

export function loadConfig(
  environment: Record<string, string | undefined>
): ApiConfig {
  const result = environmentSchema.safeParse(environment)
  if (!result.success) {
    const diagnostics = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Invalid API configuration: ${diagnostics}`)
  }

  return {
    allowedOrigins: result.data.API_ALLOWED_ORIGINS,
    databaseUrl: result.data.DATABASE_URL,
    port: result.data.API_PORT,
  }
}
