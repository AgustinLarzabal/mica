import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export function ItemViewer() {
  return (
    <>
      <Tabs defaultValue="preview" className="w-full gap-0 lg:hidden">
        <TabsList variant="line" className="w-full p-0">
          <TabsTrigger value="preview" className="font-mono uppercase">
            Preview
          </TabsTrigger>
          <TabsTrigger value="details" className="font-mono uppercase">
            Details
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="flex">
          <ItemPreview />
        </TabsContent>
        <TabsContent value="details" className="flex">
          <ItemDetails />
        </TabsContent>
      </Tabs>

      <div className="hidden flex-1 animate-fade-in lg:flex">
        <ItemPreview />
        <ItemDetails />
      </div>
    </>
  )
}

function ItemPreview() {
  return <div className="flex-1">left</div>
}

function ItemDetails() {
  return <aside className="flex-1 bg-sidebar">right</aside>
}
