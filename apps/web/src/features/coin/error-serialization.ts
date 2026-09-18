import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinCatalogResponseError,
  InvalidCoinResponseError,
} from "./api-client"
import { InvalidCoinIdError } from "./queries"

function errorAdapter(key: string, ErrorType: new (message: string) => Error) {
  return createSerializationAdapter({
    key,
    test: (value): value is Error => value instanceof ErrorType,
    // Preserve the UI error type without sending causes or stacks to the browser.
    toSerializable: (error) => error.message,
    fromSerializable: (message) => new ErrorType(message),
  })
}

export const coinErrorSerializationAdapters = [
  errorAdapter("InvalidCoinIdError", InvalidCoinIdError),
  errorAdapter("InvalidCoinResponseError", InvalidCoinResponseError),
  errorAdapter(
    "InvalidCoinCatalogResponseError",
    InvalidCoinCatalogResponseError
  ),
]
