import { createCsrfMiddleware, createStart } from "@tanstack/react-start"

import { coinErrorSerializationAdapters } from "@/features/coin/error-serialization"

export const startInstance = createStart(() => ({
  serializationAdapters: coinErrorSerializationAdapters,
  // Keep Start's default server-function protection when providing a custom entry.
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (context) => context.handlerType === "serverFn",
    }),
  ],
}))
