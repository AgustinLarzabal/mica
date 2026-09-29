import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidIssuerCodeError,
} from "./archive/coins"
import { InvalidIssuerListResponseError } from "./archive/issuers"

export {
  coinDetailQueryOptions,
  coinListQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidIssuerCodeError,
  primeCoinDetailQueries,
  validateCoinId,
} from "./archive/coins"
export {
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
} from "./archive/issuers"

function errorAdapter(key: string, ErrorType: new (message: string) => Error) {
  return createSerializationAdapter({
    key,
    test: (value): value is Error => value instanceof ErrorType,
    // Preserve the UI error type without sending causes or stacks to the browser.
    toSerializable: (error) => error.message,
    fromSerializable: (message) => new ErrorType(message),
  })
}

export const archiveErrorSerializationAdapters = [
  errorAdapter("InvalidCoinIdError", InvalidCoinIdError),
  errorAdapter("InvalidCoinResponseError", InvalidCoinResponseError),
  errorAdapter("InvalidCoinListResponseError", InvalidCoinListResponseError),
  errorAdapter(
    "InvalidIssuerListResponseError",
    InvalidIssuerListResponseError
  ),
  errorAdapter("InvalidIssuerCodeError", InvalidIssuerCodeError),
]
