import { Fragment } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  InfoCircleIcon,
  MapIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { hover, snap } from "../../../visual";
import { Button } from "../../Button";
import { Disclosure } from "../../Disclosure";
import { Separator } from "../../Separator";
import { DisclosureGroup, type DisclosureGroupProps } from "..";
import "../disclosure-group.stories.css";

const SECTIONS = [
  {
    id: "layer",
    title: "Layer details",
    icon: <StackFrontIcon aria-hidden />,
    body: "Population counts by suburb from the 2021 census."
  },
  {
    id: "source",
    title: "Data source",
    icon: <InfoCircleIcon aria-hidden />,
    body: "Australian Bureau of Statistics, published under CC BY 4.0."
  },
  {
    id: "map",
    title: "Map settings",
    icon: <MapIcon aria-hidden />,
    body: "Shown between zoom levels 8 and 16, at 80% opacity."
  }
];

// Map settings is disabled
const sections = (props: DisclosureGroupProps = {}): React.ReactElement => (
  <DisclosureGroup
    className="disclosure-group-stories-width tds-stack tds-flex-gap-sm"
    {...props}
  >
    {SECTIONS.map(({ id, title, icon, body }, index) => (
      <Fragment key={id}>
        {index > 0 && <Separator />}
        <Disclosure id={id} isDisabled={id === "map" ? true : undefined}>
          <Disclosure.Heading>
            <Button slot="trigger" variant="ghost" fullWidth>
              {icon}
              {title}
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>
              <p>{body}</p>
              <Button size="sm" variant="secondary">
                More
              </Button>
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </Fragment>
    ))}
  </DisclosureGroup>
);

describe("DisclosureGroup", () => {
  it("one expanded", async () => {
    await render(sections({ defaultExpandedKeys: ["layer"] }));
    await snap();
  });

  it("all collapsed", async () => {
    await render(sections());
    await snap();
  });

  it("multiple expanded", async () => {
    await render(
      sections({
        allowsMultipleExpanded: true,
        defaultExpandedKeys: ["layer", "source"]
      })
    );
    await snap();
  });

  it("trigger hovered", async () => {
    const screen = await render(sections({ defaultExpandedKeys: ["layer"] }));
    await hover(screen.getByRole("button", { name: "Data source" }));
    await snap();
  });

  it("trigger focused", async () => {
    const screen = await render(sections({ defaultExpandedKeys: ["layer"] }));
    const trigger = screen.getByRole("button", { name: "Layer details" });
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("another expanded by pressing", async () => {
    const screen = await render(sections({ defaultExpandedKeys: ["layer"] }));
    const trigger = screen.getByRole("button", { name: "Data source" });
    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("button", { name: "Layer details" }))
      .toHaveAttribute("aria-expanded", "false");
    await snap();
  });

  it("disabled", async () => {
    await render(sections({ isDisabled: true }));
    await snap();
  });
});
