import { APP_VERSION, COPYRIGHT_YEAR } from "@/metadata"

export function Footer() {
  return (
    <footer className="fixed right-0 bottom-0 left-0 z-10 flex h-10 items-center justify-between border-t bg-background px-5 md:px-10">
      <span className="font-mono text-xs tracking-wider text-muted">
        COIN ARCHIVE v{APP_VERSION} © {COPYRIGHT_YEAR}
      </span>
    </footer>
  )
}
