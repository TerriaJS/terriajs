import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  CaretUpDownIcon,
  ChevronRightIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { hover, press, snap } from "../../../visual";
import { Button } from "../../Button";
import { Chip } from "../../Chip";
import { Disclosure, type DisclosureProps } from "..";
import "../disclosure.stories.css";

const body = (
  <Disclosure.Body>
    <p>
      Population counts by suburb from the 2021 census, updated every five
      years.
    </p>
    <Button size="sm">Add to the map</Button>
  </Disclosure.Body>
);

const layerDetails = (props: DisclosureProps = {}): React.ReactElement => (
  <Disclosure className="disclosure-stories-width" {...props}>
    <Disclosure.Heading>
      <Button slot="trigger" variant="tertiary">
        <StackFrontIcon aria-hidden />
        Layer details
        <Disclosure.Indicator />
      </Button>
    </Disclosure.Heading>
    <Disclosure.Content>{body}</Disclosure.Content>
  </Disclosure>
);

const plain = (props: DisclosureProps = {}): React.ReactElement => (
  <Disclosure className="disclosure-stories-width" {...props}>
    <Disclosure.Heading className="tds-h6">
      <Disclosure.Trigger>
        Layer details
        <Disclosure.Indicator />
      </Disclosure.Trigger>
    </Disclosure.Heading>
    <Disclosure.Content>
      <p>
        Population counts by suburb from the 2021 census, updated every five
        years.
      </p>
    </Disclosure.Content>
  </Disclosure>
);

describe("Disclosure", () => {
  it("collapsed", async () => {
    await render(layerDetails());
    await snap();
  });

  it("expanded", async () => {
    await render(layerDetails({ defaultExpanded: true }));
    await snap();
  });

  it("trigger hovered", async () => {
    const screen = await render(layerDetails());
    await hover(screen.getByRole("button", { name: "Layer details" }));
    await snap();
  });

  it("trigger focused", async () => {
    const screen = await render(layerDetails());
    const trigger = screen.getByRole("button", { name: "Layer details" });
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("trigger pressed", async () => {
    const screen = await render(layerDetails());
    const trigger = screen.getByRole("button", { name: "Layer details" });
    await press(trigger);
    await expect.element(trigger).toHaveAttribute("data-pressed");
    await snap();
  });

  it("expanded by pressing", async () => {
    const screen = await render(layerDetails());
    const trigger = screen.getByRole("button", { name: "Layer details" });
    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await snap();
  });

  it("disabled", async () => {
    await render(layerDetails({ isDisabled: true }));
    await snap();
  });

  it("plain trigger, collapsed", async () => {
    await render(plain());
    await snap();
  });

  it("plain trigger, expanded", async () => {
    await render(plain({ defaultExpanded: true }));
    await snap();
  });

  it("plain trigger focused", async () => {
    const screen = await render(plain());
    const trigger = screen.getByRole("button", { name: "Layer details" });
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("plain trigger disabled", async () => {
    await render(plain({ isDisabled: true }));
    await snap();
  });

  it.each([false, true])("full width, expanded %s", async (expanded) => {
    await render(
      <Disclosure
        className="disclosure-stories-width"
        fullWidth
        defaultExpanded={expanded}
      >
        <Disclosure.Heading>
          <Button slot="trigger" variant="tertiary">
            <Disclosure.Indicator />
            Selected layers
            <Chip variant="primary" color="accent">
              1
            </Chip>
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>{body}</Disclosure.Content>
      </Disclosure>
    );
    await snap();
  });

  it.each([false, true])("custom indicator, expanded %s", async (expanded) => {
    await render(
      <Disclosure
        className="disclosure-stories-width"
        defaultExpanded={expanded}
      >
        <Disclosure.Heading>
          <Button slot="trigger" variant="tertiary">
            <Disclosure.Indicator>
              <ChevronRightIcon />
            </Disclosure.Indicator>
            Layer details
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>{body}</Disclosure.Content>
      </Disclosure>
    );
    await snap();
  });

  it("static indicator, expanded", async () => {
    await render(
      <Disclosure className="disclosure-stories-width" defaultExpanded>
        <Disclosure.Heading>
          <Button slot="trigger" variant="tertiary">
            <Disclosure.Indicator isStatic>
              <CaretUpDownIcon />
            </Disclosure.Indicator>
            Layer details
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>{body}</Disclosure.Content>
      </Disclosure>
    );
    await snap();
  });
});
