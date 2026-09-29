import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

import { CoinViewerDetails } from "./coin-viewer-details"
import { CoinViewerPreview } from "./coin-viewer-preview"
import type { CoinResponse } from "@workspace/api"

type ViewerPanel = "preview" | "details"

export function CoinViewerLayout({ coin }: { coin: CoinResponse }) {
  const [selectedPanel, setSelectedPanel] = useState<ViewerPanel>("preview")

  return (
    <div className="flex w-full flex-col gap-0 lg:flex-row lg:animate-fade-in">
      <ToggleGroup
        value={[selectedPanel]}
        variant="line"
        spacing={0}
        className="h-11 w-full lg:hidden"
        onValueChange={([panel]) => {
          if (panel === "preview" || panel === "details") {
            setSelectedPanel(panel)
          }
        }}
      >
        <ToggleGroupItem
          value="preview"
          className="h-full flex-1 font-mono tracking-wider uppercase"
        >
          Preview
        </ToggleGroupItem>
        <ToggleGroupItem
          value="details"
          className="h-full flex-1 font-mono tracking-wider uppercase"
        >
          Details
        </ToggleGroupItem>
      </ToggleGroup>
      <div
        className={cn(
          "flex-1 animate-fade-in lg:flex",
          selectedPanel === "preview" ? "flex" : "hidden"
        )}
      >
        <CoinViewerPreview />
      </div>
      <div
        className={cn(
          "flex-1 animate-fade-in lg:flex",
          selectedPanel === "details" ? "flex" : "hidden"
        )}
      >
        <CoinViewerDetails coin={coin} />
      </div>
    </div>
  )
}
