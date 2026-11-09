import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Tag, TagGroup, type TagGroupProps } from "..";
import { ErrorMessage, Label } from "../../Field";

const LAYERS = ["Suburbs", "Schools", "Hospitals"];

const tagGroup = (props: Partial<TagGroupProps> = {}): React.ReactElement => (
  <TagGroup {...props}>
    <Label>Layers</Label>
    <TagGroup.List>
      {LAYERS.map((layer) => (
        <Tag key={layer} id={layer}>
          {layer}
        </Tag>
      ))}
    </TagGroup.List>
  </TagGroup>
);

describe("TagGroup", () => {
  it("lists its tags as a grid named by its label", async () => {
    const screen = await render(tagGroup());

    const grid = screen.getByRole("grid", { name: "Layers" });
    await expect.element(grid).toBeVisible();
    expect(grid.getByRole("row").elements()).toHaveLength(3);
  });

  it("gives each tag a remove button only when tags can be removed", async () => {
    const onRemove = vi.fn();
    const screen = await render(tagGroup());
    expect(screen.getByRole("button").elements()).toHaveLength(0);

    await screen.rerender(tagGroup({ onRemove }));
    await userEvent.click(
      screen
        .getByRole("row", { name: "Schools" })
        .getByRole("button", { name: /Remove/ })
    );

    expect(onRemove).toHaveBeenCalledWith(new Set(["Schools"]));
  });

  it("selects tags when it allows selection", async () => {
    const screen = await render(tagGroup({ selectionMode: "multiple" }));

    await userEvent.click(screen.getByRole("row", { name: "Suburbs" }));
    await userEvent.click(screen.getByRole("row", { name: "Hospitals" }));

    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("row", { name: "Schools" }))
      .toHaveAttribute("aria-selected", "false");
    await expect
      .element(screen.getByRole("row", { name: "Hospitals" }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("sizes and colours its tags as the group says", async () => {
    const screen = await render(tagGroup({ size: "lg", variant: "surface" }));

    const tag = screen.getByRole("row", { name: "Suburbs" });
    await expect.element(tag).toHaveAttribute("data-tds-size", "lg");
    await expect.element(tag).toHaveAttribute("data-tds-variant", "surface");
  });

  it("is medium and neutral by default", async () => {
    const screen = await render(tagGroup());

    const tag = screen.getByRole("row", { name: "Suburbs" });
    await expect.element(tag).toHaveAttribute("data-tds-size", "md");
    await expect.element(tag).toHaveAttribute("data-tds-variant", "default");
  });

  it("describes its tags with an error message", async () => {
    const screen = await render(
      <TagGroup>
        <Label>Layers</Label>
        <TagGroup.List>
          <Tag id="suburbs">Suburbs</Tag>
        </TagGroup.List>
        <ErrorMessage>Select at least one layer</ErrorMessage>
      </TagGroup>
    );

    await expect
      .element(screen.getByRole("grid", { name: "Layers" }))
      .toHaveAccessibleDescription("Select at least one layer");
  });

  it("takes one Tab stop when its crosses are left out of the order", async () => {
    const screen = await render(
      <>
        <TagGroup aria-label="Layers" onRemove={vi.fn()}>
          <TagGroup.List>
            {LAYERS.map((layer) => (
              <Tag key={layer} id={layer}>
                {layer}
                <Tag.RemoveButton excludeFromTabOrder />
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
        <button type="button">After</button>
      </>
    );

    await userEvent.tab();
    await expect
      .element(screen.getByRole("row", { name: "Suburbs" }))
      .toHaveFocus();
    await userEvent.tab();
    await expect
      .element(screen.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });

  it("rings a tag's cross when the keyboard reaches it", async () => {
    const screen = await render(tagGroup({ onRemove: vi.fn() }));

    await userEvent.tab();
    await userEvent.tab();
    const cross = screen
      .getByRole("row", { name: "Suburbs" })
      .getByRole("button", { name: /Remove/ });
    await expect.element(cross).toHaveFocus();

    expect(getComputedStyle(cross.element()).boxShadow).not.toBe("none");
  });

  describe("under the pointer", () => {
    const background = (element: Element): string =>
      getComputedStyle(element).backgroundColor;

    it("highlights a tag, even one that only removes", async () => {
      const screen = await render(tagGroup({ onRemove: vi.fn() }));
      const tag = screen.getByRole("row", { name: "Suburbs" });
      const resting = background(tag.element());

      await userEvent.hover(tag);

      await expect.poll(() => background(tag.element())).not.toBe(resting);
    });

    it("highlights a tag's cross apart from its tag", async () => {
      const screen = await render(tagGroup({ onRemove: vi.fn() }));
      const cross = screen
        .getByRole("row", { name: "Suburbs" })
        .getByRole("button", { name: /Remove/ });
      const resting = background(cross.element());

      await userEvent.hover(cross);

      await expect.poll(() => background(cross.element())).not.toBe(resting);
    });
  });
});
