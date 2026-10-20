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

`typography.css` styles bare headings, paragraphs and links with the foundation's type scale, and adds `tds-h1`…`tds-h6`, `tds-body`, `tds-body-sm`, `tds-body-xs` and `tds-medium` classes for any element.
`tds-flow` on a container spaces long-form content (8px between blocks, more above headings); set `--terria-ds-flow-space` on an element to change the space above it.

Each component imports its own CSS. All styles live in the `terria-ds` cascade layer, so unlayered application CSS always wins.

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
