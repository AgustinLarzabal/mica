import { Flag } from "@/components/flags/flag"

export function ItemDetails() {
  return (
    <aside className="flex-1 border-l bg-sidebar">
      <div className="mb-2 p-6 pb-3">
        <h2 className="mb-4 font-mono text-base">Lorem ipsum dolor sit amet</h2>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flag code="ar" width={16} />
            <span>Issuer</span>
          </div>
          <span>•</span>
          <span>Ruler / Period</span>
        </div>
      </div>
      <div className="border-y px-6 py-3 font-mono text-xs text-muted-foreground">
        Lorem ipsum dolor sit amet
      </div>
    </aside>
  )
}
