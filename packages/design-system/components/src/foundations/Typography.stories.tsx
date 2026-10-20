import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Typography"
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG =
  "Terria turns spatial data into maps people can explore: layers, charts and stories, shared with a link.";

// Bare elements, styled by typography.css
export const Elements: Story = {
  render: () => (
    <div style={{ maxInlineSize: 640 }}>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
      <p>{LONG}</p>
      <p>
        A second paragraph, 8px after the first, with{" "}
        <a href="#elements">a link in it</a>.
      </p>
    </div>
  )
};

// The classes, for the other styles or for headings on other elements
export const Classes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxInlineSize: 640 }}>
      <div className="tds-h3">tds-h3 on a div</div>
      <p className="tds-body">tds-body: {LONG}</p>
      <p className="tds-body tds-medium">tds-body tds-medium</p>
      <p className="tds-body-sm">
        tds-body-sm: {LONG} <a href="#classes">A smaller link</a>
      </p>
      <p className="tds-body-sm tds-medium">tds-body-sm tds-medium</p>
      <p className="tds-body-xs">tds-body-xs: {LONG}</p>
      <p className="tds-body-xs tds-medium">tds-body-xs tds-medium</p>
    </div>
  )
};

// tds-flow: spacing between blocks of long-form content, none before the
// first. More room above a heading, less after it
export const Flow: Story = {
  render: () => (
    <article className="tds-flow" style={{ maxInlineSize: 640 }}>
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
