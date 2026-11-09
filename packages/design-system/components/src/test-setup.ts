// The global styles Storybook and apps load, so browser tests render at the
// design's real sizes. layers.css first: the first @layer fixes the order
import "./css/layers.css";
import "./css/reset.css";
import "./css/tokens.css";
import "./css/base.css";
import "./css/typography.css";
import "./css/layout/index.css";

// React Aria's virtualizer reads process.env, which browsers don't have;
// Storybook defines it empty, so tests do too, and virtualize as it does
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Absent in the browser, whatever the types say
globalThis.process ??= { env: {} } as unknown as NodeJS.Process;
