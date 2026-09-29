import { createCsrfMiddleware, createStart } from "@tanstack/react-start"

import { archiveErrorSerializationAdapters } from "@/data/archive"

export const startInstance = createStart(() => ({
  serializationAdapters: archiveErrorSerializationAdapters,
  // Keep Start's default server-function protection when providing a custom entry.
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (context) => context.handlerType === "serverFn",
    }),
  ],
}))
