export function ItemViewer() {
  return (
    <div className="flex flex-1 animate-fade-in">
      <div className="flex-1">left</div>
      <aside className="flex-1 bg-sidebar">right</aside>
    </div>
  )
}
