import { ItemNavigation } from "./item-navigation"

export function ItemHeader() {
  return (
    <header className="flex h-18 items-center border-b px-5 md:px-10">
      <ItemNavigation />
    </header>
  )
}
