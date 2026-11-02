import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { Pagination, type PaginationProps } from "..";

// The usual composition: previous, three pages with one current (the first
// unless told), a gap, the last page, and next
const pagination = (
  props: Partial<PaginationProps> = {},
  {
    onPage = vi.fn<(page: number | string) => void>(),
    isFirst = true,
    current = 1
  } = {}
): React.ReactElement => (
  <Pagination {...props}>
    <Pagination.Summary>1 to 5 of 50 layers</Pagination.Summary>
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.Previous
          isDisabled={isFirst}
          onPress={() => {
            onPage("previous");
          }}
        >
          <Pagination.PreviousIcon />
          <span>Previous</span>
        </Pagination.Previous>
      </Pagination.Item>
      {[1, 2, 3].map((page) => (
        <Pagination.Item key={page}>
          <Pagination.Link
            isActive={page === current}
            onPress={() => {
              onPage(page);
            }}
          >
            {page}
          </Pagination.Link>
        </Pagination.Item>
      ))}
      <Pagination.Item>
        <Pagination.Ellipsis />
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Link
          onPress={() => {
            onPage(10);
          }}
        >
          10
        </Pagination.Link>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Next
          onPress={() => {
            onPage("next");
          }}
        >
          <span>Next</span>
          <Pagination.NextIcon />
        </Pagination.Next>
      </Pagination.Item>
    </Pagination.Content>
  </Pagination>
);

describe("Pagination", () => {
  it("is a navigation landmark, named Pagination unless told otherwise", async () => {
    const screen = await render(pagination());
    await expect
      .element(screen.getByRole("navigation", { name: "Pagination" }))
      .toBeVisible();

    await screen.rerender(pagination({ "aria-label": "Layer pages" }));
    await expect
      .element(screen.getByRole("navigation", { name: "Layer pages" }))
      .toBeVisible();
  });

  // Screen readers don't say a page became current, so it's announced
  it("announces the page it moves to", async () => {
    const screen = await render(pagination());
    await screen.rerender(pagination({}, { current: 2 }));

    await expect
      .poll(() => document.querySelector("[aria-live='polite']")?.textContent)
      .toBe("Page 2");
  });

  it("lists its pages, marking the current one", async () => {
    const screen = await render(pagination());

    expect(screen.getByRole("listitem").elements()).toHaveLength(7);
    await expect
      .element(screen.getByRole("button", { name: "1" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByRole("button", { name: "2" }))
      .not.toHaveAttribute("aria-current");
  });

  it("goes to a page, or the next, when pressed", async () => {
    const onPage = vi.fn<(page: number | string) => void>();
    const screen = await render(pagination({}, { onPage }));

    await userEvent.click(screen.getByRole("button", { name: "2" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onPage.mock.calls).toEqual([[2], ["next"]]);
  });

  it("can't go back from the first page", async () => {
    const screen = await render(pagination());

    await expect
      .element(screen.getByRole("button", { name: "Previous" }))
      .toBeDisabled();
  });

  it("hides the gap and the arrows from assistive tech", async () => {
    const screen = await render(pagination());
    const nav = screen.getByRole("navigation").element();

    for (const part of ["ellipsis", "previous-icon", "next-icon"]) {
      expect(
        nav.querySelector(`[data-tds='pagination-${part}']`)
      ).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("points its arrows the other way right to left", async () => {
    const screen = await render(<div dir="rtl">{pagination()}</div>);
    const icon = screen
      .getByRole("navigation")
      .element()
      .querySelector("[data-tds='pagination-next-icon']");
    if (!icon) throw new Error("No icon");

    expect(getComputedStyle(icon).rotate).toBe("180deg");
  });

  it("is medium by default", async () => {
    const screen = await render(pagination());

    await expect
      .element(screen.getByRole("navigation"))
      .toHaveAttribute("data-tds-size", "md");
  });

  // A step larger on narrow screens, for fingers
  it.each([
    ["sm", 32, 28],
    ["md", 36, 32],
    ["lg", 40, 36]
  ] as const)(
    "sizes %s pages %ipx on narrow screens and %ipx on wide",
    async (size, narrow, wide) => {
      const screen = await render(pagination({ size }));
      const link = screen.getByRole("button", { name: "2" }).element();

      await page.viewport(400, 600);
      await expect
        .poll(() => link.getBoundingClientRect().height)
        .toBeCloseTo(narrow, 0);
      await page.viewport(1024, 600);
      await expect
        .poll(() => link.getBoundingClientRect().height)
        .toBeCloseTo(wide, 0);
    }
  );
});
