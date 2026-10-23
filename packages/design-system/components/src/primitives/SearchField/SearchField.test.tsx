import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SearchField, type SearchFieldProps } from ".";
import { Description, FieldError, Label } from "../Field";
import { InputGroup } from "../InputGroup";
import { Kbd } from "../Kbd";

const renderField = (props: SearchFieldProps = {}): Promise<RenderResult> =>
  render(
    <SearchField {...props}>
      <Label>Search layers</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search…" />
        <SearchField.ClearButton />
      </SearchField.Group>
      <Description>Names and descriptions</Description>
      <FieldError>Nothing matches</FieldError>
    </SearchField>
  );

describe("SearchField width", () => {
  it("hugs its group, or fills its container with fullWidth", async () => {
    const field = (fullWidth: boolean): React.ReactElement => (
      <SearchField aria-label="Search" fullWidth={fullWidth}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input />
        </SearchField.Group>
      </SearchField>
    );
    const screen = await render(
      <div style={{ inlineSize: 600 }}>
        {field(false)}
        {field(true)}
      </div>
    );

    const [hug, fill] = [
      ...screen.container.querySelectorAll('[data-tds="search-field"]')
    ].map((element) => element.getBoundingClientRect().width);
    expect(hug).toBeLessThan(600);
    expect(fill).toBe(600);
  });
});

describe("SearchField", () => {
  it("labels and describes its search box", async () => {
    const screen = await renderField();

    await expect
      .element(screen.getByRole("searchbox", { name: "Search layers" }))
      .toHaveAccessibleDescription("Names and descriptions");
  });

  it("submits the text with Enter", async () => {
    const onSubmit = vi.fn();
    const screen = await renderField({ onSubmit });

    await userEvent.type(screen.getByRole("searchbox"), "roads{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("roads");
  });

  it("clears with its button and keeps focus in the box", async () => {
    const onClear = vi.fn();
    const screen = await renderField({ defaultValue: "roads", onClear });

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onClear).toHaveBeenCalled();
    await expect.element(screen.getByRole("searchbox")).toHaveValue("");
    await expect.element(screen.getByRole("searchbox")).toHaveFocus();
  });

  it("clears with Escape", async () => {
    const screen = await renderField({ defaultValue: "roads" });

    await userEvent.click(screen.getByRole("searchbox"));
    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("shows the clear button only once there's text", async () => {
    const screen = await renderField();

    const clear = screen.getByRole("button", {
      name: "Clear search",
      includeHidden: true
    });
    await expect.element(clear).not.toBeVisible();

    await userEvent.type(screen.getByRole("searchbox"), "r");
    await expect.element(clear).toBeVisible();
  });

  it("swaps a shortcut hint for the clear button once there's text", async () => {
    const screen = await render(
      <SearchField aria-label="Search the catalogue">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input />
          <InputGroup.Suffix>
            <Kbd>/</Kbd>
          </InputGroup.Suffix>
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    );
    const hint = screen.getByText("/");
    const clear = screen.getByRole("button", {
      name: "Clear search",
      includeHidden: true
    });

    await expect.element(hint).toBeVisible();
    await expect.element(clear).not.toBeVisible();

    await userEvent.type(screen.getByRole("searchbox"), "roads");

    await expect.element(hint).not.toBeVisible();
    await expect.element(clear).toBeVisible();
  });

  it("drops the shortcut hint as soon as the input has focus", async () => {
    const screen = await render(
      <SearchField aria-label="Search the catalogue">
        <SearchField.Group>
          <SearchField.Input />
          <InputGroup.Suffix>
            <Kbd>/</Kbd>
          </InputGroup.Suffix>
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    );

    await userEvent.click(screen.getByRole("searchbox"));

    await expect.element(screen.getByText("/")).not.toBeVisible();
  });

  it("keeps other suffixes, and the rest of a suffix with a hint", async () => {
    const screen = await render(
      <SearchField aria-label="Search the catalogue">
        <SearchField.Group>
          <SearchField.Input />
          <InputGroup.Suffix>
            <Kbd>/</Kbd>
            <span>beta</span>
          </InputGroup.Suffix>
          <InputGroup.Suffix>layers</InputGroup.Suffix>
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    );

    await userEvent.type(screen.getByRole("searchbox"), "roads");

    await expect.element(screen.getByText("/")).not.toBeVisible();
    await expect.element(screen.getByText("beta")).toBeVisible();
    await expect.element(screen.getByText("layers")).toBeVisible();
  });

  it("keeps the search icon out of the accessibility tree", async () => {
    const screen = await renderField();

    const icon = screen.container.querySelector(
      '[data-tds="search-field-icon"]'
    );
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the error in place of the description while invalid", async () => {
    const screen = await renderField({ defaultValue: "zz", isInvalid: true });

    await expect.element(screen.getByText("Nothing matches")).toBeVisible();
    await expect
      .element(screen.getByText("Names and descriptions"))
      .not.toBeVisible();
  });
});
