import { useNavigate } from "@tanstack/react-router"
import type { IssuerResponse } from "@workspace/api"

export function IssuerSelect({
  issuerCode,
  issuers,
}: {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}) {
  const navigate = useNavigate({ from: "/" })
  const unknownIssuerCode =
    issuerCode && !issuers.some((issuer) => issuer.code === issuerCode)
      ? issuerCode
      : undefined

  return (
    <div className="flex items-center gap-3">
      <select
        id="issuer-filter"
        aria-label="Issuer"
        className="rounded-md border bg-background px-3 py-2 text-sm"
        value={issuerCode ?? ""}
        onChange={(event) => {
          const issuer = event.currentTarget.value
          void navigate({
            to: "/",
            search: issuer === "" ? {} : { issuer },
          })
        }}
      >
        <option value="">All issuers</option>
        {issuers.map((issuer) => (
          <option key={issuer.code} value={issuer.code}>
            {issuer.name}
          </option>
        ))}
        {unknownIssuerCode && (
          <option value={unknownIssuerCode} disabled>
            Unknown issuer ({unknownIssuerCode})
          </option>
        )}
      </select>
    </div>
  )
}
