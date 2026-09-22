import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { CoinViewerDetails } from "./coin-viewer-details"
import { CoinViewerPreview } from "./coin-viewer-preview"
import type { CoinResponse } from "@workspace/api"

export function CoinViewerTabs({ coin }: { coin: CoinResponse }) {
  return (
    <Tabs defaultValue="preview" className="w-full gap-0 lg:hidden">
      <TabsList variant="line" className="w-full p-0">
        <TabsTrigger value="preview" className="font-mono uppercase">
          Preview
        </TabsTrigger>
        <TabsTrigger value="details" className="font-mono uppercase">
          Details
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="flex animate-fade-in">
        <CoinViewerPreview />
      </TabsContent>
      <TabsContent value="details" className="flex animate-fade-in">
        <CoinViewerDetails coin={coin} />
      </TabsContent>
    </Tabs>
  )
}
