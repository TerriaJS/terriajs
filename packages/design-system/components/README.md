# @terria/design-system

Accessible React components for the Terria design system, built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) and styled with the Terria design tokens, compiled into the package as `tokens.css`.

## Styles

Import the stylesheets once in your app, layer order first:

```ts
import "@terria/design-system/layers.css";
import "@terria/design-system/reset.css"; // optional
import "@terria/design-system/tokens.css";
import "@terria/design-system/base.css";
import "@terria/design-system/typography.css";
```

The reset is optional: it normalises box sizing, margins, media and form controls page-wide, in the lowest layer. Leave it out where existing styles rely on the browser's defaults.

`typography.css` styles bare headings, paragraphs and links with the foundation's type scale, and adds `tds-h1`…`tds-h6`, `tds-body`, `tds-body-sm`, `tds-body-xs`, `tds-medium` and `tds-numeric` (equal-width figures) classes for any element.
`tds-flow` on a container spaces long-form content (8px between blocks, more above headings); set `--terria-ds-flow-space` on an element to change the space above it.

Each component imports its own CSS. All styles live in the `terria-ds` cascade layer, so unlayered application CSS always wins.

## Fonts

The design system's typeface is Inter. Components use whatever `--terria-ds-font` names, falling back to the system sans-serif. Load the font one of two ways.

**Let the design system load it.** Import `fonts.css` after the other stylesheets:

```ts
import "@terria/design-system/fonts.css";
```

It loads the variable Inter from `@fontsource-variable/inter` and points `--terria-ds-font` at it. Your bundler emits the font files, split by script so browsers only download what a page uses. With webpack, that needs a rule for `.woff2` files:

```js
{ test: /\.woff2$/, type: "asset/resource" }
```

**Load it yourself**, for example with `next/font`, and skip `fonts.css`. Set `--terria-ds-font` to the loaded family on `:root`:

```tsx
const inter = Inter({ subsets: ["latin"] });

<style jsx global>{`
  :root {
    --terria-ds-font: ${inter.style.fontFamily};
  }
`}</style>;
```

Set it on `:root`, not on a wrapper element: modals, popovers and tooltips render at the end of `<body>`, outside your app's wrapper.

## Theming

Components read the `--terria-ds-*` custom properties defined in `tokens.css`. Set `data-theme="dark"` on an ancestor to switch to the dark theme.

## Overriding styles

Components expose `data-tds` attributes to target:

```css
[data-tds="button"] {
  box-shadow: none;
}
```

To control where the design system sits in your cascade, declare the layer order yourself:

```css
@layer terria-ds, app;
```

## Development

From the repository root:

```bash
pnpm --filter @terria/design-system build
pnpm --filter @terria/design-system test
pnpm storybook
```
