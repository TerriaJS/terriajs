import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Description, FieldError, Label } from "../../Field";
import type { InputVariant } from "../../Input";
import { InputGroup } from "../../InputGroup";
import { Kbd } from "../../Kbd";
import { focusVisible, hover, press, snap } from "../../../visual";
import { SearchField, type SearchFieldProps } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];

const vehicle = (
  variant: InputVariant,
  props: SearchFieldProps = {}
): React.ReactElement => (
  <SearchField {...props}>
    <Label>Vehicle</Label>
    <SearchField.Group variant={variant}>
      <SearchField.SearchIcon />
      <SearchField.Input placeholder="Search…" />
      <SearchField.ClearButton />
    </SearchField.Group>
    <Description>More than 20 brands</Description>
    <FieldError>Brand not found</FieldError>
  </SearchField>
);

const catalogue = (props: SearchFieldProps = {}): React.ReactElement => (
  <SearchField aria-label="Search the catalogue" {...props}>
    <SearchField.Group>
      <SearchField.SearchIcon />
      <SearchField.Input placeholder="Search the catalogue" />
      <InputGroup.Suffix>
        <Kbd variant="default">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      </InputGroup.Suffix>
      <SearchField.ClearButton />
    </SearchField.Group>
  </SearchField>
);

describe.each(VARIANTS)("SearchField %s", (variant) => {
  it("empty", async () => {
    await render(vehicle(variant));
    await snap();
  });

  it("filled", async () => {
    await render(vehicle(variant, { defaultValue: "Porsche" }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(vehicle(variant));
    await hover(screen.getByRole("searchbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(vehicle(variant));
    await focusVisible(screen.getByRole("searchbox"));
    await snap();
  });

  it("typed in", async () => {
    const screen = await render(vehicle(variant));
    await userEvent.type(screen.getByRole("searchbox"), "Porsche");
    await expect
      .element(screen.getByRole("button", { name: "Clear search" }))
      .toBeVisible();
    await snap();
  });

  it("invalid", async () => {
    await render(vehicle(variant, { defaultValue: "Apple", isInvalid: true }));
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(
      vehicle(variant, { defaultValue: "Apple", isInvalid: true })
    );
    await focusVisible(screen.getByRole("searchbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(
      vehicle(variant, { defaultValue: "Porsche", isDisabled: true })
    );
    await snap();
  });

  it("clear button hovered", async () => {
    const screen = await render(vehicle(variant, { defaultValue: "Porsche" }));
    await hover(screen.getByRole("button", { name: "Clear search" }));
    await snap();
  });

  it("clear button pressed", async () => {
    const screen = await render(vehicle(variant, { defaultValue: "Porsche" }));
    await press(screen.getByRole("button", { name: "Clear search" }));
    await snap();
  });
});

describe("SearchField", () => {
  it("without a label", async () => {
    await render(
      <SearchField aria-label="Search layers">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search layers" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    );
    await snap();
  });

  it("shortcut hint", async () => {
    await render(catalogue());
    await snap();
  });

  it("shortcut hint, focused", async () => {
    const screen = await render(catalogue());
    await focusVisible(screen.getByRole("searchbox"));
    await snap();
  });

  it("shortcut hint, filled", async () => {
    await render(catalogue({ defaultValue: "Bridges" }));
    await snap();
  });
});
