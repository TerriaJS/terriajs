import { describe, expect, it } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent, type Locator } from "vitest/browser";
import { DisclosureGroup, type DisclosureGroupProps } from "..";
import { Disclosure } from "../../Disclosure";

const SECTIONS = ["Layers", "Legend", "Data source"];

const renderGroup = (
  props: Partial<DisclosureGroupProps> = {}
): Promise<RenderResult> =>
  render(
    <DisclosureGroup {...props}>
      {SECTIONS.map((section) => (
        <Disclosure key={section} id={section}>
          <Disclosure.Heading>
            <Disclosure.Trigger>
              {section}
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>{`${section} content`}</Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      ))}
    </DisclosureGroup>
  );

const trigger = (screen: RenderResult, name: string): Locator =>
  screen.getByRole("button", { name });

describe("DisclosureGroup", () => {
  it("keeps each trigger a button in a level 3 heading", async () => {
    const screen = await renderGroup();

    for (const section of SECTIONS) {
      await expect
        .element(
          screen
            .getByRole("heading", { level: 3, name: section })
            .getByRole("button", { name: section })
        )
        .toHaveAttribute("aria-expanded", "false");
    }
  });

  it("opens one section at a time", async () => {
    const screen = await renderGroup();

    await userEvent.click(trigger(screen, "Layers"));
    await userEvent.click(trigger(screen, "Legend"));

    await expect
      .element(trigger(screen, "Layers"))
      .toHaveAttribute("aria-expanded", "false");
    await expect
      .element(trigger(screen, "Legend"))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("opens several with allowsMultipleExpanded", async () => {
    const screen = await renderGroup({ allowsMultipleExpanded: true });

    await userEvent.click(trigger(screen, "Layers"));
    await userEvent.click(trigger(screen, "Legend"));

    await expect
      .element(trigger(screen, "Layers"))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(trigger(screen, "Legend"))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("starts with the sections in defaultExpandedKeys open", async () => {
    const screen = await renderGroup({ defaultExpandedKeys: ["Legend"] });

    await expect.element(screen.getByText("Legend content")).toBeVisible();
    await expect
      .element(trigger(screen, "Layers"))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("disables every section while disabled", async () => {
    const screen = await renderGroup({ isDisabled: true });

    for (const section of SECTIONS) {
      await expect.element(trigger(screen, section)).toBeDisabled();
    }
  });
});
