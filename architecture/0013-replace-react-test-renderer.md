# 13. Replace react-test-renderer and react-shallow-testutils with @testing-library/react

Date: 2026-02-10

## Status

Accepted

## Context

TerriaJS component tests currently rely on two React testing libraries that are deprecated and incompatible with the React ecosystem's direction:

**react-test-renderer** provides a renderer that outputs React component trees as JavaScript objects. Tests use `create()` to render, then traverse the tree with methods like `findByType()`, `findByProps()`, `findAllByType()`, and `root.children`. Several files also use the `ReactTestRenderer` type for variable annotations and `act()` from this package.

**react-shallow-testutils** extends React's deprecated shallow renderer with traversal utilities (`findAllWithType`, `findAll`, `isComponentOfType`). TerriaJS also wraps these in custom utilities in `test/ReactViews/MoreShallowTools.ts` — `getShallowRenderedOutput()`, `getMountedInstance()`, `findAllEqualTo()`, and `findAllWithPropsChildEqualTo()`.

### Problems

1. **react-test-renderer is deprecated in React 19.** The React team has announced it will not be maintained going forward. The package was deprecated in React 18.x with a console warning directing users to `@testing-library/react`. Staying on these libraries blocks future React upgrades.

2. **Shallow rendering is removed in React 19.** `react-test-renderer/shallow` (the `createRenderer` API) is gone entirely. Tests using `react-shallow-testutils` and the `MoreShallowTools.ts` utility module will not work at all.

3. **Tests assert on implementation, not behavior.** The dominant patterns — `findByType(ComponentName)`, `findByProps({ someProp: value })`, `findAllWithType(InternalComponent)` — couple tests to internal component structure. These tests break when components are refactored even if user-visible behavior is unchanged. For example:

   - `rendered.root.findByType(SearchForm)` — asserts that a specific child component type exists in the tree
   - `findAllWithType(result, DataCatalogMember)` — counts internal component instances
   - `findByProps({ active: true })` — inspects internal prop values

4. **Two testing paradigms create confusion.** The codebase has test files using both `@testing-library/react` and `react-test-renderer`. New contributors must learn both APIs, and there's no consistent pattern to follow.

5. **Custom utilities add maintenance burden.** `MoreShallowTools.ts` is a bespoke wrapper around deprecated APIs that must be understood and maintained independently.

## Decision

We will use `@testing-library/react` for all component tests. The deprecated `react-test-renderer` and `react-shallow-testutils` libraries will be removed from the codebase.

Tests will query and interact with components through their rendered DOM output using the accessibility tree (`getByRole`), visible text (`getByText`), and form labels (`getByLabelText`). Direct DOM queries (`container.querySelector`) remain acceptable for non-semantic elements and sanitization checks.

### Migration approach

The following patterns guide the conversion of existing tests:

**For tests using react-test-renderer (`create`, `findByType`, `findByProps`):**

| Before (react-test-renderer)      | After (@testing-library/react)              |
| --------------------------------- | ------------------------------------------- |
| `create(<Component />)`           | `render(<Component />)`                     |
| `root.findByType(Component)`      | `screen.getByRole()` / `screen.getByText()` |
| `root.findByProps({ name: "x" })` | `screen.getByRole("button", { name: "x" })` |
| `root.findAllByType("li")`        | `screen.getAllByRole("listitem")`           |
| `act()` from react-test-renderer  | `act()` from `react` (React 18+)            |
| `renderer.update(<Component />)`  | `rerender(<Component />)`                   |
| `.click()` / `fireEvent.click()`  | `userEvent.click()`                         |

**For tests using react-shallow-testutils (`findAllWithType`, `findAll`, `isComponentOfType`):**

| Before (react-shallow-testutils)             | After (@testing-library/react)                    |
| -------------------------------------------- | ------------------------------------------------- |
| `getShallowRenderedOutput(<C />)`            | `render(<C />)`                                   |
| `findAllWithType(output, Tag)`               | `screen.getAllByRole()` / `screen.getAllByText()` |
| `isComponentOfType(el, Component)`           | Assert on rendered output via `screen` queries    |
| `findAllEqualTo(output, text)`               | `screen.getByText(text)`                          |
| `findAllWithPropsChildEqualTo(output, text)` | `screen.getByText(text)`                          |

**Query priority** (per Testing Library guiding principles):

1. `getByRole` — preferred; queries the accessibility tree
2. `getByText` — for visible text content
3. `getByLabelText` — for form elements
4. `container.querySelector` — last resort for elements with no accessible role (e.g., `<script>`, `<br>`, CSS class assertions)

### What stays

`container.querySelector` / `container.querySelectorAll` remains appropriate for:

- Script tag sanitization checks (`querySelectorAll("script").length`)
- Non-semantic element counting (`<br>`, `<b>`)
- CSS class presence checks (`.jj`, `.jk`)
- Complex dynamically-computed text assertions (locale-dependent number formatting, timezone-dependent date formatting)

### Cleanup after full migration

- Remove `react-test-renderer` and `@types/react-test-renderer` from `package.json`
- Remove `react-shallow-testutils` from `package.json`
- Delete `test/ReactViews/MoreShallowTools.ts`

## Alternatives considered

### Migrate directly to Vitest browser mode

Vitest is a completely new test runner that would replace Karma/Jasmine. Its browser mode runs tests in a real browser via Playwright/WebdriverIO and provides its own rendering and component testing library (`vitest-browser-react`) rather than `@testing-library/react`. This migration would involve three simultaneous changes: a new test runner, a new assertion API, and a new component testing API. Combining all of these at once would make the migration too large and impossible to review.

By decoupling the two concerns, the `@testing-library/react` conversion can be done as a standalone step that works with the existing Karma test runner. Each converted file can be reviewed and merged independently. A subsequent test runner migration can then focus purely on the runner change without also rethinking how every component test queries the DOM.

## Consequences

### Positive

- **Partially unblocks React 19 upgrade.** No dependency on deprecated rendering APIs.
- **Tests verify user-visible behavior.** Queries like `getByRole("button", { name: "Submit" })` assert what the user sees, not how the component tree is structured. Refactoring internals no longer breaks tests.
- **Single testing paradigm.** All component tests use the same API, reducing onboarding friction.
- **Accessibility coverage as a side effect.** `getByRole` queries fail when elements lack proper ARIA roles, surfacing accessibility issues during development.
- **Eliminates custom test utilities.** `MoreShallowTools.ts` and its bespoke traversal functions are no longer needed.
- **Aligns with React ecosystem.** `@testing-library/react` is the React team's recommended testing library and has broad community adoption.

### Negative

- **Migration effort.** Each file requires understanding what behavior the test was actually verifying, then rewriting queries to target that behavior through the DOM rather than the component tree.
- **Some tests need rethinking.** Tests that assert on internal component types (e.g., "renders a `SearchForm` component") must be rewritten to assert on the visible result of rendering that component. This is the correct trade-off but requires more thought per test.
- **`container` is still necessary in some cases.** Not all DOM assertions map cleanly to `screen` queries — sanitization checks, non-semantic element counts, and CSS class assertions still need direct DOM access.

### Risks

- **Behavioral equivalence is not guaranteed.** Shallow-rendered tests that asserted on component types were testing different things than full DOM renders with `screen` queries. Some tests may need to verify behavior differently rather than being a 1:1 translation.

## References

- [React 19 migration guide — removal of react-test-renderer](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-react-test-renderer)
- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles)
- [Testing Library query priority](https://testing-library.com/docs/queries/about#priority)
