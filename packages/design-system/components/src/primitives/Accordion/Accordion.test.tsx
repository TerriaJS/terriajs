import { describe, expect, it } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent, type Locator } from "vitest/browser";
import { Accordion, type AccordionProps } from ".";

const SECTIONS = ["Layers", "Legend", "Data source"];

const renderAccordion = (
  props: Partial<AccordionProps> = {}
): Promise<RenderResult> =>
  render(
    <Accordion {...props}>
      {SECTIONS.map((section) => (
        <Accordion.Item key={section} id={section}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {section}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{`${section} content`}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );

const trigger = (screen: RenderResult, name: string): Locator =>
  screen.getByRole("button", { name });

describe("Accordion", () => {
  it("puts each trigger button in a level 3 heading", async () => {
    const screen = await renderAccordion();

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

  it("shows an item's content, named by its trigger, while expanded", async () => {
    const screen = await renderAccordion();

    await userEvent.click(trigger(screen, "Legend"));

    await expect
      .element(screen.getByRole("group", { name: "Legend" }))
      .toHaveTextContent("Legend content");
  });

  it("hides its indicator from assistive technology and flips it while expanded", async () => {
    const screen = await renderAccordion();
    const indicator = (): Element | null =>
      screen.container.querySelector('[data-tds="accordion-indicator"]');

    expect(indicator()?.getAttribute("aria-hidden")).toBe("true");
    expect(indicator()?.hasAttribute("data-expanded")).toBe(false);

    await userEvent.click(trigger(screen, "Layers"));

    await expect.poll(indicator).toHaveAttribute("data-expanded");
  });

  it("draws the indicator for the item's state from a function", async () => {
    const screen = await render(
      <Accordion>
        <Accordion.Item id="layers">
          <Accordion.Heading>
            <Accordion.Trigger>
              Layers
              <Accordion.Indicator isStatic>
                {({ isExpanded }) => (isExpanded ? "minus" : "plus")}
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>Layers content</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    );
    const indicator = (): string =>
      screen.container.querySelector('[data-tds="accordion-indicator"]')
        ?.textContent ?? "";

    expect(indicator()).toBe("plus");

    await userEvent.click(screen.getByRole("button", { name: "Layers" }));

    await expect.poll(indicator).toBe("minus");
  });

  it("opens one item at a time", async () => {
    const screen = await renderAccordion();

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
    const screen = await renderAccordion({ allowsMultipleExpanded: true });

    await userEvent.click(trigger(screen, "Layers"));
    await userEvent.click(trigger(screen, "Legend"));

    await expect
      .element(trigger(screen, "Layers"))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("toggles an item from the keyboard", async () => {
    const screen = await renderAccordion();

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await expect
      .element(trigger(screen, "Layers"))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("starts with the items in defaultExpandedKeys open", async () => {
    const screen = await renderAccordion({ defaultExpandedKeys: ["Legend"] });

    await expect.element(screen.getByText("Legend content")).toBeVisible();
  });

  it("disables every item while disabled", async () => {
    const screen = await renderAccordion({ isDisabled: true });

    for (const section of SECTIONS) {
      await expect.element(trigger(screen, section)).toBeDisabled();
    }
  });

  it("defaults to the default variant and marks the secondary one", async () => {
    const accordion = (screen: RenderResult): Element | null =>
      screen.container.querySelector('[data-tds="accordion"]');

    const plain = await renderAccordion();
    expect(accordion(plain)?.getAttribute("data-tds-variant")).toBe("default");

    const secondary = await renderAccordion({ variant: "secondary" });
    expect(accordion(secondary)?.getAttribute("data-tds-variant")).toBe(
      "secondary"
    );
  });
});
