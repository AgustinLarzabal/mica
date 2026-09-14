import { ItemDetails } from "./components/item-details"
import { ItemPreview } from "./components/item-preview"
import { ItemTabs } from "./components/item-tabs"

export function ItemViewer() {
  return (
    <>
      <ItemTabs />
      <div className="hidden flex-1 animate-fade-in lg:flex">
        <ItemPreview />
        <ItemDetails />
      </div>
    </>
  )
}
