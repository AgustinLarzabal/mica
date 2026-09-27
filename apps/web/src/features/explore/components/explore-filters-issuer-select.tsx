import { useNavigate } from "@tanstack/react-router"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  const items = [
    { label: "All issuers", value: "" },
    ...issuers.map((issuer) => ({
      label: issuer.name,
      value: issuer.code,
    })),
    ...(unknownIssuerCode
      ? [
          {
            label: `Unknown issuer (${unknownIssuerCode})`,
            value: unknownIssuerCode,
          },
        ]
      : []),
  ]

  return (
    <div className="flex items-center gap-3">
      <Select
        name="issuer"
        items={items}
        value={issuerCode ?? ""}
        onValueChange={(issuer) => {
          void navigate({
            to: "/",
            search: issuer === null || issuer === "" ? {} : { issuer },
          })
        }}
      >
        <SelectTrigger
          id="issuer-filter"
          aria-label="Issuer"
          className="w-[calc(20vw-(--spacing(20)))]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="">All issuers</SelectItem>
            {issuers.map((issuer) => (
              <SelectItem key={issuer.code} value={issuer.code}>
                {issuer.name}
              </SelectItem>
            ))}
            {unknownIssuerCode && (
              <SelectItem value={unknownIssuerCode} disabled>
                Unknown issuer ({unknownIssuerCode})
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
