import { ExploreItem } from "./explore-item"

export function ExploreGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 11 }).map((_, index) => (
        <ExploreItem
          key={index}
          itemId={String(index + 1)}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          Item
        </ExploreItem>
      ))}
    </div>
  )
}
