import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export function CoinViewerPreview() {
  return (
    <div className="flex-1">
      <Tabs defaultValue="obverse" className="w-full">
        <div className="px-3 pt-5 pb-1 lg:p-0">
          <TabsList variant="responsive" className="w-full">
            <TabsTrigger value="obverse" className="font-mono uppercase">
              Obverse
            </TabsTrigger>
            <TabsTrigger value="reverse" className="font-mono uppercase">
              Reverse
            </TabsTrigger>
            <TabsTrigger value="edge" className="font-mono uppercase">
              Edge
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="obverse">
          <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
            <div className="px-7 py-5">
              <div className="mb-5 flex justify-center">
                <img src="/coin-placeholder.webp" />
              </div>
              <div className="space-y-4 text-pretty lg:p-10">
                <p className="mb-4 font-mono text-base">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="reverse">
          <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
            <div className="px-7 py-5">
              <div className="mb-5 flex justify-center">
                <img src="/coin-placeholder2.webp" />
              </div>
              <div className="space-y-4 text-pretty lg:p-10">
                <p className="mb-4 font-mono text-base">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="edge">
          <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
            <div className="px-7 py-5">
              <div className="mb-5 flex justify-center">
                <img src="/coin-placeholder3.webp" />
              </div>
              <div className="space-y-4 text-pretty lg:p-10">
                <p className="mb-4 font-mono text-base">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nullam eros tellus, elementum in finibus ac, finibus rhoncus
                  magna. Fusce rutrum nisi ac sapien semper, nec suscipit diam
                  tristique. Nunc et risus pulvinar, egestas magna et, bibendum
                  nunc. Nulla elementum, massa nec eleifend cursus, dui sapien
                  pellentesque dolor, nec tempus dui ipsum et ligula.
                </p>
                <p className="font-mono text-muted-foreground">
                  Nulla facilisi. Duis in mattis metus, in iaculis arcu.
                  Praesent pharetra quam in accumsan maximus. Praesent tristique
                  vulputate nisl vel rutrum. Pellentesque porttitor dui quis
                  placerat suscipit.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
