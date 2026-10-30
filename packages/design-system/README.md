# Design System Monorepo

A modern design system built with React, TypeScript, and Vite in a pnpm monorepo.

## Structure

```
design-system/
├── packages/
│   ├── tokens/       # Design tokens, built into components (internal)
│   ├── components/   # React components
│   └── icons/        # Icon components
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Development Mode

Watch mode for all packages:

```bash
pnpm dev
```

### Testing

Run tests for all packages:

```bash
pnpm test
```

Watch mode for tests:

```bash
pnpm test:watch
```

Visual tests (`*.visual.tsx`) screenshot each component in each of its states, in both themes. Take the references, then compare against them:

```bash
pnpm --filter @terria/design-system test:visual -u
pnpm --filter @terria/design-system test:visual
```

On a PR, a maintainer comments `/terria-bot visual-test` to compare its components with the base branch's; the differences are posted on the PR. Comment again to run them again after new commits.

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
pnpm lint:fix
```

### Formatting

```bash
pnpm format
pnpm format:check
```

## Packages

### @terria/design-system-tokens

Internal: builds the design tokens (colors, spacing, typography) from the
Figma export into `components/src/css/tokens.css`. It isn't
published; apps get the compiled tokens from `@terria/design-system`.

```css
@import url("@terria/design-system/tokens.css");
```

### @terria/design-system

React components built with the design system.

```typescript
import { Button } from "@terria/design-system";
```

### @terria/design-system-icons

Icon components.

```typescript
import { CheckIcon } from "@terria/design-system-icons";
```

## Scripts

Available at root level:

- `pnpm build` - Build all packages
- `pnpm dev` - Watch mode for all packages
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Lint and fix issues
- `pnpm format` - Format all files
- `pnpm format:check` - Check formatting
- `pnpm typecheck` - Type check all packages
- `pnpm clean` - Remove all build artifacts and dependencies

## Publishing

Packages are scoped under `@terria/` namespace. Configure publishing in individual package.json files.

## License

MIT
