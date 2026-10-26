import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Link } from ".";

describe("Link", () => {
  it("is a link named by its text, going to its href", async () => {
    const screen = await render(
      <Link href="https://terria.io">Terria website</Link>
    );

    await expect
      .element(screen.getByRole("link", { name: "Terria website" }))
      .toHaveAttribute("href", "https://terria.io");
  });

  it("keeps its icon out of its name, an external-link arrow unless replaced", async () => {
    const screen = await render(
      <div>
        <Link href="https://terria.io">
          Terria website
          <Link.Icon />
        </Link>
        <Link href="#legend">
          Legend
          <Link.Icon>
            <svg data-testid="own-icon" />
          </Link.Icon>
        </Link>
      </div>
    );

    await expect
      .element(screen.getByRole("link", { name: "Terria website" }))
      .toBeInTheDocument();
    const icons = screen.container.querySelectorAll('[data-tds="link-icon"]');
    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
      expect(icon.querySelector("svg")).not.toBeNull();
    }
    await expect.element(screen.getByTestId("own-icon")).toBeInTheDocument();
  });

  it("does something on press without an href", async () => {
    const onPress = vi.fn();
    const screen = await render(<Link onPress={onPress}>Show more</Link>);

    await userEvent.click(screen.getByRole("link", { name: "Show more" }));

    expect(onPress).toHaveBeenCalledOnce();
  });

  it("can't be followed while disabled", async () => {
    const onPress = vi.fn();
    const screen = await render(
      <Link onPress={onPress} isDisabled>
        Show more
      </Link>
    );
    const link = screen.getByRole("link", { name: "Show more" });

    await userEvent.click(link, { force: true });

    expect(onPress).not.toHaveBeenCalled();
    await expect.element(link).toHaveAttribute("aria-disabled", "true");
  });
});
