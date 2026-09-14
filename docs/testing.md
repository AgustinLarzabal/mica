# Testing

The web application owns this repository's test suite. Tests, test setup,
Vitest configuration, and test scripts belong in `apps/web`. The shared UI
package in `packages/ui` has no owned tests, test configuration, setup module,
or test scripts.

Web application tests may import components from `@workspace/ui` normally.
Those components can execute as part of an application test, but source owned
by `packages/ui` remains excluded from the web application's coverage report.

## Commands

From the repository root, run the complete deterministic test task through
Turbo:

```bash
pnpm test
```

This dispatches the terminating `test` script to workspaces that own one. At
present, that is the web application. The shared UI package does not own a test
script.

The web workspace can also be targeted explicitly from the repository root:

```bash
pnpm --filter web test
pnpm --filter web test:watch
pnpm --filter web test:coverage
```

Alternatively, run the same scripts from `apps/web`:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

`test` and `test:coverage` are deterministic runs: they execute once and
terminate. `test:watch` is interactive and continues watching for file changes
until it is stopped.

## Writing tests

Colocate test files with the application source they cover under
`apps/web/src`, using the `*.test.ts` or `*.test.tsx` suffix. Vitest discovers
only those patterns in the web application.

The testing stack provides:

- Vitest as the test runner and assertion library.
- jsdom as the browser-like DOM environment.
- React Testing Library for rendering components and querying the rendered UI.
- `@testing-library/user-event` for realistic user interactions such as
  clicking and typing.
- jest-dom for DOM-specific matchers such as `toBeInTheDocument`.

Shared setup loads the jest-dom matchers and cleans up rendered React trees
after each test. Contributors do not need to repeat that setup in individual
test files.

Test externally visible behavior. Prefer semantic, accessibility-oriented
queries such as `getByRole` with an accessible name, and drive interactions
with user-event. Avoid assertions about component internals, implementation
details, or styling classes: those can change without changing behavior.

Components that depend on TanStack Router need an explicit router test harness.
When such tests are introduced, render the component with the router context,
route tree, and location its public behavior requires rather than assuming the
application router is initialized by the lightweight Vitest configuration.

## Coverage

```bash
pnpm --filter web test:coverage
```

Coverage uses Vitest's V8 provider. It prints a text summary and writes an HTML
report to `apps/web/coverage`; that generated directory is ignored by Git.
Coverage includes web application source even when a source file is not reached
by the current tests.

The report excludes test and spec files, central test setup, generated source,
declaration files, configuration files, and all source owned by `packages/ui`.
There are no initial coverage thresholds for statements, branches, functions,
or lines, so coverage is currently an inspection tool rather than a merge gate.
