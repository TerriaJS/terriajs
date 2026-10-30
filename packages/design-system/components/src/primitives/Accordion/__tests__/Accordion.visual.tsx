import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  MapIcon,
  MinusIcon,
  PlusIcon,
  RulerMeasureIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { hover, snap } from "../../../visual";
import { Accordion, type AccordionProps } from "..";
import "../accordion.stories.css";

const ITEMS = [
  {
    id: "layers",
    title: "Layers",
    icon: <StackFrontIcon aria-hidden />,
    body: "Add data from the catalogue, or drop a file on the map, to see it here."
  },
  {
    id: "legend",
    title: "Legend",
    icon: <MapIcon aria-hidden />,
    body: "Each layer's legend shows what its colours and symbols mean."
  },
  {
    id: "measure",
    title: "Measuring",
    icon: <RulerMeasureIcon aria-hidden />,
    body: "Draw a line or an area on the map to measure its length or size."
  }
];

type Options = AccordionProps & { icons?: boolean; plusMinus?: boolean };

// Measuring is disabled; Layers is open
const items = ({ icons, plusMinus, ...props }: Options): React.ReactElement => (
  <Accordion
    className="accordion-stories-width"
    defaultExpandedKeys={["layers"]}
    {...props}
  >
    {ITEMS.map(({ id, title, icon, body }) => (
      <Accordion.Item key={id} id={id} isDisabled={id === "measure"}>
        <Accordion.Heading>
          <Accordion.Trigger>
            {icons && icon}
            {title}
            {plusMinus ? (
              <Accordion.Indicator isStatic>
                {({ isExpanded }) =>
                  isExpanded ? <MinusIcon size={16} /> : <PlusIcon size={16} />
                }
              </Accordion.Indicator>
            ) : (
              <Accordion.Indicator />
            )}
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>{body}</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion>
);

describe.each(["default", "secondary"] as const)("Accordion %s", (variant) => {
  const accordion = (options: Options = {}): React.ReactElement =>
    items({ variant, ...options });

  it("default", async () => {
    await render(accordion());
    await snap();
  });

  it("all collapsed", async () => {
    await render(accordion({ defaultExpandedKeys: [] }));
    await snap();
  });

  it("collapsed item hovered", async () => {
    const screen = await render(accordion());
    await hover(screen.getByRole("button", { name: "Legend" }));
    await snap();
  });

  it("expanded item hovered", async () => {
    const screen = await render(accordion());
    await hover(screen.getByRole("button", { name: "Layers" }));
    await snap();
  });

  it("item focused", async () => {
    const screen = await render(accordion());
    const trigger = screen.getByRole("button", { name: "Legend" });
    await userEvent.keyboard("{Tab}{Tab}");
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("expanded item focused", async () => {
    const screen = await render(accordion());
    const trigger = screen.getByRole("button", { name: "Layers" });
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("expanded by pressing", async () => {
    const screen = await render(accordion());
    const trigger = screen.getByRole("button", { name: "Legend" });
    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("button", { name: "Layers" }))
      .toHaveAttribute("aria-expanded", "false");
    await snap();
  });

  it("disabled item hovered", async () => {
    const screen = await render(accordion());
    await hover(screen.getByRole("button", { name: "Measuring" }));
    await snap();
  });

  it("separator hidden", async () => {
    await render(accordion({ hideSeparator: true }));
    await snap();
  });

  it("multiple expanded", async () => {
    await render(
      accordion({
        allowsMultipleExpanded: true,
        defaultExpandedKeys: ["layers", "legend"]
      })
    );
    await snap();
  });

  it("with icons", async () => {
    await render(accordion({ icons: true }));
    await snap();
  });

  it("plus and minus indicator", async () => {
    await render(accordion({ plusMinus: true }));
    await snap();
  });
});
