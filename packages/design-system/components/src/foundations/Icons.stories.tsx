import type { Meta, StoryObj } from "@storybook/react-vite";
// The gallery shows every export, so it needs them all
// eslint-disable-next-line import/no-namespace
import * as icons from "@terria/design-system-icons";
import type { Icon } from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { figmaDesign } from "../figma";
import { CopyButton, TokenName, Usage } from "./docs";
import { customProperties, token } from "./tokens";
import "./docs.stories.css";
import "./Icons.stories.css";

const meta = {
  title: "Foundations/Icons",
  parameters: figmaDesign("Icons"),
  // Icons.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const PACKAGE = "@terria/design-system-icons";

// Every icon component the package exports, by its export name: the
// capitalised ones ending in Icon
const allIcons = Object.entries(icons).filter(
  (entry): entry is [string, Icon] => /^[A-Z]\w*Icon$/.test(entry[0])
);

const isFilled = (name: string): boolean => name.endsWith("FilledIcon");

// MapPinFilledIcon → map-pin-filled: the name in Figma and in the sprite
const kebabName = (name: string): string =>
  name
    .replace(/Icon$/, "")
    .replace(/([a-z0-9])([A-Z])|([a-z])([0-9])/g, "$1$3-$2$4")
    .toLowerCase();

// An icon with its name, and a button that copies its import
const Tile = ({
  name,
  icon: IconComponent
}: {
  name: string;
  icon: Icon;
}): ReactNode => {
  const usage = `import { ${name} } from "${PACKAGE}";`;
  return (
    <li className="icon-tile" title={name}>
      <IconComponent />
      <span className="icon-tile-name">{kebabName(name)}</span>
      <CopyButton text={usage} label={usage} />
    </li>
  );
};

const Gallery = ({ filled }: { filled: boolean }): ReactNode => (
  <ul className="icon-gallery">
    {allIcons
      .filter(([name]) => isFilled(name) === filled)
      .map(([name, icon]) => (
        <Tile key={name} name={name} icon={icon} />
      ))}
  </ul>
);

// Shown in Icons.mdx only, not in the sidebar
const docsOnly = ["!dev"];

export const Regular: Story = {
  tags: docsOnly,
  render: () => <Gallery filled={false} />
};

export const Filled: Story = {
  tags: docsOnly,
  render: () => <Gallery filled />
};

export const Sizes: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="icon-sizes">
        {["xs", "sm", "md", "lg"].map((size) => {
          const name = `dimensions-icon-size-${size}`;
          return (
            <figure key={size} className="icon-size tds-flow">
              <span
                className="icon-size-sample"
                style={customProperties({ "--_size": token(name) })}
              >
                <icons.MapIcon />
              </span>
              <figcaption>
                <TokenName name={name} />
              </figcaption>
            </figure>
          );
        })}
      </div>
      <Usage
        code={`.button svg {
  inline-size: var(--terria-ds-dimensions-icon-size-sm);
  block-size: var(--terria-ds-dimensions-icon-size-sm);
}`}
      />
    </div>
  )
};

export const Usages: Story = {
  name: "Usage",
  tags: docsOnly,
  render: () => (
    <Usage
      code={`import { MapIcon, SearchIcon } from "${PACKAGE}";

// Decorative, next to text that says what it means: hidden from
// assistive technology
<button type="button">
  <MapIcon size={16} />
  Map
</button>

// On its own: a label makes it an image with that name
<SearchIcon aria-label="Search" />`}
    />
  )
};

export const Sprite: Story = {
  tags: docsOnly,
  render: () => (
    <Usage
      code={`import spriteUrl from "${PACKAGE}/sprite.svg";
import { IconSpriteProvider, SpriteIcon } from "${PACKAGE}/sprite";

// Once, near the root: where the app serves the sprite
<IconSpriteProvider href={spriteUrl}>
  <App />
</IconSpriteProvider>

// Names are type-checked: a wrong one doesn't compile
<SpriteIcon name="map" />
<SpriteIcon name="map-pin-filled" aria-label="Selected location" />`}
    />
  )
};
