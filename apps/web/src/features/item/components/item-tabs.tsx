import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { ItemDetails } from "./item-details"
import { ItemPreview } from "./item-preview"

export function ItemTabs() {
  return (
    <Tabs defaultValue="details" className="w-full gap-0 lg:hidden">
      <TabsList variant="line" className="w-full p-0">
        <TabsTrigger value="preview" className="font-mono uppercase">
          Preview
        </TabsTrigger>
        <TabsTrigger value="details" className="font-mono uppercase">
          Details
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="flex animate-fade-in">
        <ItemPreview />
      </TabsContent>
      <TabsContent value="details" className="flex animate-fade-in">
        <ItemDetails />
      </TabsContent>
    </Tabs>
  )
}
