import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useState } from "react";
import { Button } from "../primitives/Button";
import { Chip } from "../primitives/Chip";
import { Input } from "../primitives/Input";
import { figmaDesign } from "../figma";
import "./docs.stories.css";
import "./Typography.stories.css";

const meta = {
  title: "Foundations/Typography",
  parameters: figmaDesign("Typography"),
  // Typography.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG =
  "Terria turns spatial data into maps people can explore: layers, charts and stories, shared with a link.";

const WEIGHTS: Record<string, string> = {
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold"
};

type SpecProps = {
  // What to use in code, one chip each
  code: string[];
  description: string;
  // The paragraph spacing typography.css gives p + p
  paragraphs?: boolean;
  // One element in the style, named after it
  children: React.ReactNode;
};

// One row of the type scale, laid out like the Figma page. The spec on the
// left is read from the sample's computed style, so it can't drift from the
// CSS
const Spec = ({
  code,
  description,
  paragraphs,
  children
}: SpecProps): React.ReactNode => {
  const [style, setStyle] = useState<CSSStyleDeclaration | null>(null);
  const measure = useCallback((sample: HTMLElement | null) => {
    const element = sample?.firstElementChild;
    if (element) setStyle(getComputedStyle(element));
  }, []);
  return (
    <div className="type-spec">
      <div className="type-spec-meta">
        {style && (
          <>
            {/* The family's first word: "Inter Variable" is shown as Inter */}
            <strong>
              {style.fontFamily.replace(/"/g, "").split(/[ ,]/)[0]}
            </strong>
            <strong>
              {WEIGHTS[style.fontWeight] ?? style.fontWeight} {style.fontSize}
            </strong>
            <div>Line height {style.lineHeight}</div>
            {paragraphs && <div>Paragraph spacing 8px</div>}
            {style.textDecorationLine.includes("underline") && (
              <div>Underlined</div>
            )}
          </>
        )}
        <div className="type-spec-hooks">
          {code.map((hook) => (
            <Chip key={hook} size="sm">
              <Chip.Label>
                <code>{hook}</code>
              </Chip.Label>
            </Chip>
          ))}
        </div>
      </div>
      <div className="type-spec-sample tds-flow">
        <div ref={measure}>{children}</div>
        <p className="type-spec-description">{description}</p>
      </div>
    </div>
  );
};

// The type scale, as the Figma Typography page lays it out
export const Scale: Story = {
  // Shown in Typography.mdx only, not in the sidebar
  tags: ["!dev"],
  render: () => (
    <div>
      <Spec
        code={["h1", ".tds-h1"]}
        description="Used for the main screen title, should be used only once per screen. It pairs with body base."
      >
        <h1>Heading 1</h1>
      </Spec>
      <Spec
        code={["h2", ".tds-h2"]}
        description="Used for main section titles within a screen. Provides hierarchy below Heading 1 and should be used sparingly. Pairs with body base."
      >
        <h2>Heading 2</h2>
      </Spec>
      <Spec
        code={["h3", ".tds-h3"]}
        description="Used for subsection titles or important content blocks. Helps break down information within a section. Pairs with body sm or body base."
      >
        <h3>Heading 3</h3>
      </Spec>
      <Spec
        code={["h4", ".tds-h4"]}
        description="Used for subsection titles or important content blocks. Helps break down information within a section. Pairs with body sm or body base."
      >
        <h4>Heading 4</h4>
      </Spec>
      <Spec
        code={["h5", ".tds-h5"]}
        description="Used for subsection titles or important content blocks. Helps break down information within a section. Pairs with body sm or body base."
      >
        <h5>Heading 5</h5>
      </Spec>
      <Spec
        code={["h6", ".tds-h6"]}
        description="Used for subsection titles or important content blocks. Helps break down information within a section. Pairs with body sm or body base."
      >
        <h6>Heading 6</h6>
      </Spec>
      <Spec
        code={["body", ".tds-body"]}
        paragraphs
        description="Default paragraph style for most content. Optimized for readability at medium sizes. Used across long-form text, descriptions, and details."
      >
        <p className="tds-body">Body base</p>
      </Spec>
      <Spec
        code={[".tds-body.tds-medium"]}
        paragraphs
        description="Same as body base, but with medium font weight. Provides subtle emphasis for key points, labels, or short content blocks."
      >
        <p className="tds-body tds-medium">Body base medium</p>
      </Spec>
      <Spec
        code={[".tds-body-sm"]}
        paragraphs
        description="Used for secondary or supporting text. Ideal for captions, metadata, and content with lower emphasis."
      >
        <p className="tds-body-sm">Body sm</p>
      </Spec>
      <Spec
        code={[".tds-body-sm.tds-medium"]}
        paragraphs
        description="Same as body small, but with medium font weight. Provides stronger emphasis for small text, such as inline labels or status indicators."
      >
        <p className="tds-body-sm tds-medium">Body sm medium</p>
      </Spec>
      <Spec
        code={[".tds-body-xs"]}
        description="Used for fine print, footnotes, and dense UI elements where space is limited. Should not be overused."
      >
        <p className="tds-body-xs">Body xs</p>
      </Spec>
      <Spec
        code={[".tds-body-xs.tds-medium"]}
        description="Same as body xs, but with medium font weight. Adds clarity and hierarchy in tight spaces like tables or input helpers."
      >
        <p className="tds-body-xs tds-medium">Body xs medium</p>
      </Spec>
      <Spec
        code={["a in body text"]}
        description="Default link style for inline navigation or actions. Used in body content, menus, or lists."
      >
        <a href="#scale" className="tds-body">
          Link base
        </a>
      </Spec>
      <Spec
        code={["a in .tds-body-sm"]}
        description="Used for inline links in smaller text contexts such as captions, footnotes, or secondary actions."
      >
        <a href="#scale" className="tds-body-sm">
          Link sm
        </a>
      </Spec>
      <Spec
        code={["<Input />"]}
        description="Used for input text in compact fields. Ideal for dense layouts or secondary forms where space is limited. Maintains legibility at smaller sizes."
      >
        <Input aria-label="Text field sm" defaultValue="Text field sm" />
      </Spec>
      <Spec
        code={['<Button size="lg" />']}
        description="Primary button text style. Optimized for legibility and balance within medium/large buttons."
      >
        <Button size="lg">Button base</Button>
      </Spec>
      <Spec
        code={["<Button />"]}
        description="Button text style for compact buttons. Used where space is limited while keeping readability."
      >
        <Button>Button sm</Button>
      </Spec>
    </div>
  )
};

// tds-flow: spacing between blocks of long-form content, none before the
// first. More room above a heading, less after it
export const Flow: Story = {
  // Shown in Typography.mdx only, not in the sidebar
  tags: ["!dev"],
  render: () => (
    <article className="tds-flow docs-example">
      <h2>Exploring the map</h2>
      <p>{LONG}</p>
      <p>
        Add data from the catalogue, or drag in your own files. Each layer shows
        in the workbench, where you can change its style and order.
      </p>
      <h3>Sharing a view</h3>
      <p>Share links keep the camera, the layers and their settings.</p>
      <ul>
        <li>Copy a link</li>
        <li>Embed the map in a page</li>
      </ul>
      <blockquote>
        <p>A map is the greatest of all epic poems.</p>
      </blockquote>
      <h4>Printing</h4>
      <p>Print the current view with its legend.</p>
    </article>
  )
};

// The same paragraph at a comfortable measure and stretched to the full width
export const LineLength: Story = {
  // Shown in Typography.mdx only, not in the sidebar
  tags: ["!dev"],
  render: () => (
    <div className="docs-example docs-example-rows">
      <figure className="tds-flow">
        <figcaption className="docs-caption">About 65 characters</figcaption>
        <p className="type-measure">
          {LONG} Add data from the catalogue, or drag in your own files. Each
          layer shows in the workbench, where you can change its style and
          order.
        </p>
      </figure>
      <figure className="tds-flow">
        <figcaption className="docs-caption">The full width</figcaption>
        <p>
          {LONG} Add data from the catalogue, or drag in your own files. Each
          layer shows in the workbench, where you can change its style and
          order.
        </p>
      </figure>
    </div>
  )
};

const VALUES = ["1,111.11", "8,808.08", "245.70", "19,034.25"];

// Proportional figures against tds-numeric's equal-width ones
export const Numbers: Story = {
  // Shown in Typography.mdx only, not in the sidebar
  tags: ["!dev"],
  render: () => (
    <div className="docs-example-columns docs-example">
      <figure className="tds-flow">
        <figcaption className="docs-caption">Default</figcaption>
        <ul className="type-numbers">
          {VALUES.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      </figure>
      <figure className="tds-flow">
        <figcaption className="docs-caption">tds-numeric</figcaption>
        <ul className="type-numbers tds-numeric">
          {VALUES.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      </figure>
    </div>
  )
};
