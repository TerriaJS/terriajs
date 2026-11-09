import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { ChevronRightIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Link, type LinkProps } from "..";

const callToAction = (props: LinkProps = {}): React.ReactElement => (
  <Link href="https://terria.io" target="_blank" {...props}>
    Call to action
    <Link.Icon />
  </Link>
);

describe("Link", () => {
  it("default", async () => {
    await render(callToAction());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(callToAction());
    await hover(screen.getByRole("link"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(callToAction());
    await focusVisible(screen.getByRole("link"));
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(callToAction());
    await focusVisible(screen.getByRole("link"));
    await hover(screen.getByRole("link"));
    await snap();
  });

  // Let go, as each test does at its end, the press is a click: one that
  // stays on the page
  it("pressed", async () => {
    const screen = await render(
      callToAction({ href: "#call-to-action", target: "_self" })
    );
    await press(screen.getByRole("link"));
    await snap();
  });

  it("disabled", async () => {
    await render(callToAction({ isDisabled: true }));
    await snap();
  });

  it("in text", async () => {
    await render(
      <p>
        Data from the{" "}
        <Link href="https://www.abs.gov.au">
          Australian Bureau of Statistics
        </Link>
        , updated every five years.
      </p>
    );
    await snap();
  });

  it("in text, hovered", async () => {
    const screen = await render(
      <p>
        Data from the{" "}
        <Link href="https://www.abs.gov.au">
          Australian Bureau of Statistics
        </Link>
        , updated every five years.
      </p>
    );
    await hover(screen.getByRole("link"));
    await snap();
  });

  it("custom icon", async () => {
    await render(
      <Link href="#legend">
        Open legend
        <Link.Icon>
          <ChevronRightIcon />
        </Link.Icon>
      </Link>
    );
    await snap();
  });

  it("without an href", async () => {
    await render(<Link onPress={() => undefined}>Show all layers</Link>);
    await snap();
  });
});
