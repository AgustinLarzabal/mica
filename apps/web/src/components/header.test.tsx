import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Header } from "./header"

describe("Header", () => {
  it("identifies the application by name", () => {
    render(<Header />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Mica" })
    ).toBeInTheDocument()
  })
})
