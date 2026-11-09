import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Usage } from "./docs";
import "./docs.stories.css";
import "./Layout.stories.css";

const meta = {
  title: "Foundations/Layout",
  // Layout.mdx is the docs page
  tags: ["!autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Shown in Layout.mdx only, not in the sidebar
const docsOnly = ["!dev"];

// A child of an example, plain on the page's surface so the hatched gaps
// between children show. Called, not rendered as a component, so a story's
// code shows the markup
const item = (text: string, className?: string): ReactNode => (
  <div key={text} className={`layout-item ${className ?? ""}`}>
    {text}
  </div>
);

// An example's caption: the classes it uses
const caption = (classes: string): ReactNode => (
  <figcaption className="docs-caption">
    <code>{classes}</code>
  </figcaption>
);

export const Stack: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <figure className="layout-example">
        <div className="tds-stack layout-demo">
          {item("Layer name")}
          {item("Opacity")}
          {item("Legend")}
        </div>
        {caption("tds-stack")}
      </figure>
      <Usage
        code={`<div class="tds-stack">
  <label>…</label>
  <input />
</div>`}
      />
    </div>
  )
};

export const Cluster: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <figure className="layout-example">
        <div className="tds-cluster layout-demo layout-narrow">
          {["Roads", "Rail", "Boundaries", "Labels", "Buildings"].map((text) =>
            item(text)
          )}
        </div>
        {caption("tds-cluster")}
      </figure>
      <Usage
        code={`<div class="tds-cluster">
  <span class="chip">Roads</span>
  <span class="chip">Rail</span>
</div>`}
      />
    </div>
  )
};

export const Row: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <figure className="layout-example">
        <div className="tds-row layout-demo">
          {item("Workbench")}
          {item("Collapse all", "tds-ms-auto")}
          {item("Remove all")}
        </div>
        {caption("tds-row, tds-ms-auto on the first action")}
      </figure>
      <Usage
        code={`<header class="tds-row">
  <h2>Workbench</h2>
  <button class="tds-ms-auto">Collapse all</button>
  <button>Remove all</button>
</header>`}
      />
    </div>
  )
};

export const Grid: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <figure className="layout-example">
        <div className="tds-grid layout-demo layout-columns">
          {["Name", "Type", "Updated", "Roads", "Vector", "Today"].map((text) =>
            item(text)
          )}
        </div>
        {caption("tds-grid, with grid-template-columns from your CSS")}
      </figure>
      <figure className="layout-example">
        <div className="tds-grid-fit layout-demo layout-fit">
          {["Satellite", "Terrain", "Streets", "Dark", "Light"].map((text) =>
            item(text)
          )}
        </div>
        {caption("tds-grid-fit, --terria-ds-grid-item-min: 8rem")}
      </figure>
      <Usage
        code={`<ul class="tds-grid-fit gallery">
  <li class="card">…</li>
</ul>

.gallery {
  --terria-ds-grid-auto-layout: auto-fill;
  --terria-ds-grid-item-min: 12rem;
  --terria-ds-grid-item-max: 20rem;
}`}
      />
    </div>
  )
};

const GAPS = ["xs", "sm", "md", "lg", "xl"];

export const Gaps: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="layout-gaps">
        {GAPS.map((size) => (
          <figure key={size} className="layout-example">
            <div className={`tds-row tds-flex-gap-${size} layout-demo`}>
              {item("A")}
              {item("B")}
            </div>
            {caption(`tds-flex-gap-${size}`)}
          </figure>
        ))}
      </div>
      <figure className="layout-example">
        <div className="tds-grid tds-grid-gap-x-xl tds-grid-gap-y-xs layout-demo layout-columns">
          {["1", "2", "3", "4", "5", "6"].map((text) => item(text))}
        </div>
        {caption("tds-grid tds-grid-gap-x-xl tds-grid-gap-y-xs")}
      </figure>
      <Usage
        code={`<div class="tds-stack tds-flex-gap-lg">…</div>
<div class="tds-grid-fit tds-grid-gap-sm">…</div>
<div class="tds-grid tds-grid-gap-x-xl tds-grid-gap-y-xs">…</div>`}
      />
    </div>
  )
};

const ALIGN = ["start", "center", "end"];

export const Alignment: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="layout-alignments">
        {ALIGN.map((align) => (
          <figure key={align} className="layout-example">
            <div
              className={`tds-row tds-items-${align} layout-demo layout-tall`}
            >
              {item("Short")}
              {item("Taller item", "layout-item-tall")}
            </div>
            {caption(`tds-items-${align}`)}
          </figure>
        ))}
        {["start", "center", "between"].map((justify) => (
          <figure key={justify} className="layout-example">
            <div className={`tds-row tds-justify-${justify} layout-demo`}>
              {item("A")}
              {item("B")}
            </div>
            {caption(`tds-justify-${justify}`)}
          </figure>
        ))}
      </div>
      <Usage code={`<div class="tds-cluster tds-items-start">…</div>`} />
    </div>
  )
};

export const Spacing: Story = {
  tags: docsOnly,
  render: () => (
    <div className="tds-flow">
      <div className="layout-alignments">
        {[
          { classes: "tds-p-md", text: "Padding all round" },
          { classes: "tds-px-xl tds-py-xs", text: "Inline and block" },
          { classes: "tds-ps-2xl", text: "Inline start only" }
        ].map(({ classes, text }) => (
          <figure key={classes} className="layout-example">
            <div className={`layout-demo layout-padding ${classes}`}>
              {item(text)}
            </div>
            {caption(classes)}
          </figure>
        ))}
      </div>
      <Usage
        code={`<section class="tds-p-lg">…</section>
<p class="tds-mt-xl">…</p>
<div class="tds-mx-auto">…</div>`}
      />
    </div>
  )
};
