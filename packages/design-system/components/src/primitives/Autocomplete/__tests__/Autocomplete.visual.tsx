import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MapIcon, WorldIcon, WorldMapIcon } from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { focusVisible, hover, snap, viewport } from "../../../visual";
import { Description, FieldError, Label } from "../../Field";
import { Header } from "../../Header";
import { ListBox } from "../../ListBox";
import { SearchField } from "../../SearchField";
import { Separator } from "../../Separator";
import { Tag, TagGroup } from "../../TagGroup";
import { Autocomplete, type AutocompleteProps } from "..";
import "../autocomplete.stories.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory"
].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "-"), name }));

const options = (items: { id: string; name: string }[]): ReactNode =>
  items.map((item) => (
    <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
      {item.name}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  ));

const field = (): Locator => {
  const trigger = document.querySelector<HTMLElement>(
    '[data-tds="autocomplete-trigger"]'
  );
  if (!trigger) throw new Error("No autocomplete trigger");
  return page.elementLocator(trigger);
};

// Opened with a click, placed, done animating in, its search field focused
const open = async (): Promise<void> => {
  await userEvent.click(field());
  await expect.element(page.getByRole("listbox")).toBeVisible();
  await expect.element(page.getByRole("searchbox")).toHaveFocus();
  await settled();
};

// Matches regardless of case, as the stories' useFilter does
const contains = (text: string, filter: string): boolean =>
  text.toLowerCase().includes(filter.toLowerCase());

const stateAutocomplete = ({
  label = "State",
  shown = <Autocomplete.Value />,
  list = options(STATES),
  after,
  ...props
}: Partial<AutocompleteProps<object, "single" | "multiple">> & {
  label?: string;
  shown?: ReactNode;
  list?: ReactNode;
  after?: ReactNode;
} = {}): React.ReactElement => {
  return (
    <Autocomplete
      placeholder="Select one"
      className="autocomplete-stories-field"
      {...props}
    >
      <Label>{label}</Label>
      <Autocomplete.Trigger>
        {shown}
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- Focus moves into the search field as the list opens, as in the stories */}
          <SearchField autoFocus aria-label={`Search ${label.toLowerCase()}`}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => "No results found"}>{list}</ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
      {after}
    </Autocomplete>
  );
};

describe.each(["primary", "secondary"] as const)(
  "Autocomplete %s",
  (variant) => {
    it("placeholder", async () => {
      await render(stateAutocomplete({ variant }));
      await snap();
    });

    it("with a value", async () => {
      await render(stateAutocomplete({ variant, defaultValue: "victoria" }));
      await snap();
    });

    it("hovered", async () => {
      await render(stateAutocomplete({ variant }));
      await hover(field());
      await snap();
    });

    it("focused", async () => {
      await render(stateAutocomplete({ variant }));
      await focusVisible(page.getByRole("button", { name: /State/ }));
      await snap();
    });

    it("hovered and focused", async () => {
      await render(stateAutocomplete({ variant }));
      await focusVisible(page.getByRole("button", { name: /State/ }));
      await hover(field());
      await snap();
    });

    it("disabled", async () => {
      await render(
        stateAutocomplete({
          variant,
          isDisabled: true,
          defaultValue: "victoria"
        })
      );
      await snap();
    });

    it("invalid", async () => {
      await render(
        stateAutocomplete({
          variant,
          isInvalid: true,
          after: <FieldError>Select a state</FieldError>
        })
      );
      await snap();
    });

    it("open", async () => {
      await render(stateAutocomplete({ variant, defaultValue: "victoria" }));
      await open();
      await snap(viewport());
    });
  }
);

describe("Autocomplete", () => {
  it("clear button hovered", async () => {
    await render(stateAutocomplete({ defaultValue: "victoria" }));
    await hover(page.getByRole("button", { name: "Clear selection" }));
    await snap();
  });

  it("with a description", async () => {
    await render(
      stateAutocomplete({
        after: <Description>Select your state of residence</Description>
      })
    );
    await snap();
  });

  it("full width", async () => {
    await render(
      <div className="autocomplete-stories-wide">
        {stateAutocomplete({ fullWidth: true, className: undefined })}
      </div>
    );
    await snap();
  });

  it("several values as tags", async () => {
    await render(
      stateAutocomplete({
        label: "States",
        selectionMode: "multiple",
        defaultValue: ["victoria", "queensland", "tasmania"],
        shown: (
          <Autocomplete.Value>
            {({ defaultChildren, isPlaceholder, state }) =>
              isPlaceholder ? (
                defaultChildren
              ) : (
                <TagGroup aria-label="Chosen states" size="sm">
                  <TagGroup.List>
                    {state.selectedItems.map((item) => (
                      <Tag key={item.key} id={item.key}>
                        {item.textValue}
                        <Tag.RemoveButton />
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              )
            }
          </Autocomplete.Value>
        )
      })
    );
    await snap();
  });

  it("several values, open", async () => {
    await render(
      stateAutocomplete({
        selectionMode: "multiple",
        defaultValue: ["victoria", "queensland"]
      })
    );
    await open();
    await snap(viewport());
  });

  it("filtered", async () => {
    await render(stateAutocomplete());
    await open();
    await userEvent.keyboard("south");
    await expect
      .poll(() => document.querySelectorAll('[role="option"]').length)
      .toBe(2);
    await snap(viewport());
  });

  it("no results", async () => {
    await render(stateAutocomplete());
    await open();
    await userEvent.keyboard("perth");
    await expect.element(page.getByText("No results found")).toBeVisible();
    await snap(viewport());
  });

  it("item hovered", async () => {
    await render(stateAutocomplete({ defaultValue: "victoria" }));
    await open();
    await hover(page.getByRole("option", { name: "Queensland" }));
    await snap(viewport());
  });

  it("item focused from the keyboard", async () => {
    await render(stateAutocomplete({ defaultValue: "victoria" }));
    await open();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect
      .element(page.getByRole("option", { name: "Western Australia" }))
      .toHaveAttribute("data-focus-visible");
    await snap(viewport());
  });

  it("items disabled", async () => {
    await render(stateAutocomplete({ disabledKeys: ["victoria", "tasmania"] }));
    await open();
    await snap(viewport());
  });

  it("sections", async () => {
    await render(
      stateAutocomplete({
        label: "City",
        placeholder: "Select a city",
        list: (
          <>
            <ListBox.Section>
              <Header>Australia</Header>
              {options([
                { id: "sydney", name: "Sydney" },
                { id: "melbourne", name: "Melbourne" }
              ])}
            </ListBox.Section>
            <Separator />
            <ListBox.Section>
              <Header>New Zealand</Header>
              {options([{ id: "auckland", name: "Auckland" }])}
            </ListBox.Section>
          </>
        )
      })
    );
    await open();
    await snap(viewport());
  });

  it("icons and descriptions", async () => {
    const maps = [
      {
        id: "osm",
        name: "OpenStreetMap",
        note: "Streets and places",
        Icon: MapIcon
      },
      {
        id: "satellite",
        name: "Satellite",
        note: "Aerial imagery",
        Icon: WorldIcon
      },
      {
        id: "terrain",
        name: "Terrain",
        note: "Elevation shaded relief",
        Icon: WorldMapIcon
      }
    ];
    await render(
      stateAutocomplete({
        label: "Base map",
        placeholder: "Select a base map",
        defaultValue: "satellite",
        list: maps.map(({ id, name, note, Icon }) => (
          <ListBox.Item key={id} id={id} textValue={name}>
            <Icon aria-hidden size={16} />
            <div className="autocomplete-stories-option">
              <Label>{name}</Label>
              <Description>{note}</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))
      })
    );
    await open();
    await snap(viewport());
  });
});
