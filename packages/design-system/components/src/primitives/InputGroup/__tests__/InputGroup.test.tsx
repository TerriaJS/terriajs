import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { InputGroup, type InputGroupProps } from "..";
import { Label, TextField } from "../../Field";

const renderGroup = (
  props: Partial<InputGroupProps> = {}
): Promise<RenderResult> =>
  render(
    <TextField>
      <Label>Price</Label>
      <InputGroup {...props}>
        <InputGroup.Prefix>$</InputGroup.Prefix>
        <InputGroup.Input />
        <InputGroup.Suffix>AUD</InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );

const group = (container: HTMLElement): HTMLElement => {
  const element = container.querySelector<HTMLElement>(
    '[data-tds="input-group"]'
  );
  if (!element) throw new Error("input group not rendered");
  return element;
};

describe("InputGroup", () => {
  it("labels its input through the surrounding field", async () => {
    const screen = await renderGroup();

    await expect
      .element(screen.getByRole("textbox", { name: "Price" }))
      .toBeInTheDocument();
  });

  it("puts the prefix before the input and the suffix after it", async () => {
    const screen = await renderGroup();

    const parts = [...group(screen.container).children].map(
      (child) => child.getAttribute("data-tds") ?? ""
    );
    expect(parts).toEqual([
      "input-group-prefix",
      "input-group-input",
      "input-group-suffix"
    ]);
  });

  it("passes typing through to the field", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TextField aria-label="Price" onChange={onChange}>
        <InputGroup>
          <InputGroup.Input />
        </InputGroup>
      </TextField>
    );

    await userEvent.type(screen.getByRole("textbox"), "42");

    expect(onChange).toHaveBeenLastCalledWith("42");
  });

  it("takes a multi-line text area in place of the input", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TextField onChange={onChange}>
        <Label>Feedback</Label>
        <InputGroup>
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.TextArea rows={3} />
        </InputGroup>
      </TextField>
    );

    const textArea = screen.getByRole("textbox", { name: "Feedback" });
    expect(textArea.element().tagName).toBe("TEXTAREA");
    await userEvent.type(textArea, "one{Enter}two");
    expect(onChange).toHaveBeenLastCalledWith("one\ntwo");
  });

  it("defaults to primary and undivided", async () => {
    const screen = await renderGroup();

    const root = group(screen.container);
    expect(root.getAttribute("data-tds-variant")).toBe("primary");
    expect(root.hasAttribute("data-tds-divided")).toBe(false);
    expect(root.hasAttribute("data-tds-full-width")).toBe(false);
  });

  it("marks the secondary variant, dividers and full width", async () => {
    const screen = await renderGroup({
      variant: "secondary",
      isDivided: true,
      fullWidth: true
    });

    const root = group(screen.container);
    expect(root.getAttribute("data-tds-variant")).toBe("secondary");
    expect(root.hasAttribute("data-tds-divided")).toBe(true);
    expect(root.hasAttribute("data-tds-full-width")).toBe(true);
  });

  it("defaults to horizontal and stacks its parts when vertical", async () => {
    const screen = await renderGroup();
    expect(group(screen.container).getAttribute("data-tds-orientation")).toBe(
      "horizontal"
    );

    const vertical = await render(
      <TextField aria-label="Prompt">
        <InputGroup orientation="vertical">
          <InputGroup.Prefix>Context</InputGroup.Prefix>
          <InputGroup.TextArea />
          <InputGroup.Suffix>Actions</InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    const root = group(vertical.container);
    expect(root.getAttribute("data-tds-orientation")).toBe("vertical");
    expect(getComputedStyle(root).flexDirection).toBe("column");
  });

  it("shows focus on the group while its input has focus", async () => {
    const screen = await renderGroup();

    await userEvent.click(screen.getByRole("textbox"));

    expect(group(screen.container).hasAttribute("data-focus-within")).toBe(
      true
    );
  });
});
