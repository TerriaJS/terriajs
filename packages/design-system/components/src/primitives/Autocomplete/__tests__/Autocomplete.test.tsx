import { useFilter } from "react-aria/useFilter";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Autocomplete, type AutocompleteProps } from "..";
import { Label } from "../../Field";
import { ListBox } from "../../ListBox";
import { SearchField } from "../../SearchField";
import { Tag, TagGroup } from "../../TagGroup";

const LAYERS = [
  { id: "suburbs", name: "Suburbs" },
  { id: "parks", name: "Parks and reserves" },
  { id: "schools", name: "Schools" },
  { id: "hospitals", name: "Hospitals" }
];

type Layer = (typeof LAYERS)[number];

// The usual composition: the trigger with its value, clear button and
// chevron, and a popover whose search field filters its list. With `tags`,
// the choices show as tags that remove themselves
const LayerPicker = ({
  tags,
  ...props
}: Partial<AutocompleteProps<Layer, "single" | "multiple">> & {
  tags?: boolean;
}): React.ReactElement => {
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <Autocomplete placeholder="Choose a layer" {...props}>
      <Label>Layer</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }) =>
            tags && !isPlaceholder ? (
              <TagGroup
                aria-label="Chosen layers"
                size="sm"
                onRemove={(keys) => {
                  state.setValue(
                    state.selectedItems
                      .map((item) => item.key)
                      .filter((key) => !keys.has(key))
                  );
                }}
              >
                <TagGroup.List>
                  {state.selectedItems.map((item) => (
                    <Tag key={item.key} id={item.key}>
                      {item.textValue}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            ) : (
              defaultChildren
            )
          }
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- Focus moves into the search field as the user opens the list */}
          <SearchField autoFocus aria-label="Search layers">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search…" />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => "No layers found"}>
            {LAYERS.map((layer) => (
              <ListBox.Item key={layer.id} id={layer.id} textValue={layer.name}>
                {layer.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
};

const trigger = (
  screen: Awaited<ReturnType<typeof render>>
): ReturnType<typeof screen.getByRole> =>
  screen.getByRole("button", { name: /Layer/ });

// The field around the button, which shows the value
const field = (screen: Awaited<ReturnType<typeof render>>): HTMLElement => {
  const element = trigger(screen)
    .element()
    .closest<HTMLElement>('[data-tds="autocomplete-trigger"]');
  if (!element) throw new Error("No field");
  return element;
};

describe("Autocomplete", () => {
  it("opens a list from its button, with the search field focused", async () => {
    const screen = await render(<LayerPicker />);

    await expect.element(field(screen)).toHaveTextContent("Choose a layer");
    await userEvent.click(trigger(screen));

    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await expect
      .element(screen.getByRole("searchbox", { name: "Search layers" }))
      .toHaveFocus();
  });

  it("filters its list as you type", async () => {
    const screen = await render(<LayerPicker />);

    await userEvent.click(trigger(screen));
    await userEvent.keyboard("hosp");

    await expect
      .element(screen.getByRole("option", { name: "Hospitals" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("option", { name: "Schools" }))
      .not.toBeInTheDocument();
  });

  it("says so when nothing matches", async () => {
    const screen = await render(<LayerPicker />);

    await userEvent.click(trigger(screen));
    await userEvent.keyboard("rivers");

    await expect.element(screen.getByText("No layers found")).toBeVisible();
  });

  it("shows the option chosen, and closes", async () => {
    const onChange = vi.fn();
    const screen = await render(<LayerPicker onChange={onChange} />);

    await userEvent.click(trigger(screen));
    await userEvent.click(screen.getByRole("option", { name: "Schools" }));

    expect(onChange).toHaveBeenCalledWith("schools");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    await expect.element(field(screen)).toHaveTextContent("Schools");
  });

  it("opens when pressed anywhere on its field", async () => {
    const screen = await render(<LayerPicker />);
    const field = trigger(screen)
      .element()
      .closest('[data-tds="autocomplete-trigger"]');
    if (!field) throw new Error("No trigger");

    await userEvent.click(field, { position: { x: 8, y: 8 } });

    await expect.element(screen.getByRole("listbox")).toBeVisible();
  });

  it("clears its choice, without opening", async () => {
    const onClear = vi.fn();
    const screen = await render(
      <LayerPicker defaultValue="parks" onClear={onClear} />
    );
    const clear = screen.getByRole("button", {
      name: "Clear selection",
      includeHidden: true
    });

    await userEvent.click(clear);

    expect(onClear).toHaveBeenCalled();
    await expect.element(field(screen)).toHaveTextContent("Choose a layer");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    await expect.element(clear).toHaveAttribute("data-empty");
  });

  it("can hold several choices, staying open as they're made", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <LayerPicker selectionMode="multiple" onChange={onChange} />
    );

    await userEvent.click(trigger(screen));
    await userEvent.click(screen.getByRole("option", { name: "Suburbs" }));
    await userEvent.click(screen.getByRole("option", { name: "Schools" }));

    expect(onChange).toHaveBeenLastCalledWith(["suburbs", "schools"]);
    await expect.element(screen.getByRole("listbox")).toBeVisible();
  });

  it("shows several choices as tags, each removed without opening", async () => {
    const screen = await render(
      <LayerPicker
        tags
        selectionMode="multiple"
        defaultValue={["suburbs", "schools"]}
      />
    );
    const chosen = screen.getByRole("grid", { name: "Chosen layers" });

    await userEvent.click(
      chosen
        .getByRole("row", { name: "Suburbs" })
        .getByRole("button", { name: /Remove/ })
    );

    expect(chosen.getByRole("row").elements()).toHaveLength(1);
    await expect.element(chosen.getByRole("row")).toHaveTextContent("Schools");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("turns its chevron while open", async () => {
    const screen = await render(<LayerPicker />);
    const chevron = field(screen).querySelector(
      '[data-tds="autocomplete-indicator"]'
    );

    expect(chevron).not.toHaveAttribute("data-open");
    await userEvent.click(trigger(screen));
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    expect(chevron).toHaveAttribute("data-open");
  });

  it("can't be opened when disabled", async () => {
    const screen = await render(<LayerPicker isDisabled />);

    await expect.element(trigger(screen)).toBeDisabled();
    expect(field(screen)).toHaveAttribute("data-disabled");
  });

  it("doesn't open when its disabled field is clicked beside the button", async () => {
    const screen = await render(<LayerPicker isDisabled />);

    // Forced: the field is marked disabled, which the click would wait out
    await userEvent.click(field(screen), {
      force: true,
      position: { x: 8, y: 8 }
    });

    expect(screen.getByRole("listbox").query()).toBeNull();
  });

  it("opens a popover as wide as its field", async () => {
    const screen = await render(<LayerPicker fullWidth />);
    const field = trigger(screen)
      .element()
      .closest('[data-tds="autocomplete-trigger"]');

    await userEvent.click(trigger(screen));
    const popover = screen
      .getByRole("listbox")
      .element()
      .closest('[data-tds="popover"]');

    // Once it has grown in from its opening animation
    await expect
      .poll(() => popover?.getBoundingClientRect().width)
      .toBeCloseTo(field?.getBoundingClientRect().width ?? 0, 0);
  });

  it("marks its variant", async () => {
    const screen = await render(<LayerPicker variant="secondary" />);

    expect(
      trigger(screen).element().closest('[data-tds="autocomplete"]')
    ).toHaveAttribute("data-tds-variant", "secondary");
  });
});
