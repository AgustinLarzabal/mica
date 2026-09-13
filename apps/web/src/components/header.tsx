import { APP_VERSION } from "@/metadata"

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex h-18 items-center justify-between border-b bg-background px-5 md:px-10">
      <div className="flex items-baseline gap-2">
        <h1 className="font-pixel text-2xl tracking-wide md:text-3xl">Mica</h1>
        <span className="font-mono text-xs tracking-wider text-muted">
          v{APP_VERSION}
        </span>
      </div>
    </header>
  )
}
