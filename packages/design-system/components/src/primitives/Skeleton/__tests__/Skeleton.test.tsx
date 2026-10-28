import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Skeleton } from "..";

const animation = (element: Element | null, pseudo?: string): string =>
  element ? getComputedStyle(element, pseudo).animationName : "none";

describe("Skeleton", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty(
      "--terria-ds-skeleton-animation"
    );
  });

  it("shimmers by default", async () => {
    const screen = await render(<Skeleton data-testid="line" />);
    const line = screen.getByTestId("line").element();

    expect(animation(line, "::after")).toBe("terria-ds-skeleton-shimmer");
  });

  it("pulses, or keeps still, when asked", async () => {
    const screen = await render(
      <>
        <Skeleton data-testid="pulse" animationType="pulse" />
        <Skeleton data-testid="still" animationType="none" />
      </>
    );
    const pulse = screen.getByTestId("pulse").element();
    const still = screen.getByTestId("still").element();

    expect(animation(pulse)).toBe("terria-ds-skeleton-pulse");
    expect(animation(pulse, "::after")).toBe("none");
    expect(animation(still)).toBe("none");
    expect(animation(still, "::after")).toBe("none");
  });

  it("takes the app's default animation from the page", async () => {
    document.documentElement.style.setProperty(
      "--terria-ds-skeleton-animation",
      "pulse"
    );
    const screen = await render(<Skeleton data-testid="line" />);

    expect(animation(screen.getByTestId("line").element())).toBe(
      "terria-ds-skeleton-pulse"
    );
  });

  // One band passes over the whole composition, not one per shape
  it("shimmers once across the skeletons it holds", async () => {
    const screen = await render(
      <Skeleton data-testid="card">
        <Skeleton data-testid="image" />
        <Skeleton data-testid="title" />
      </Skeleton>
    );
    const card = screen.getByTestId("card").element();

    expect(animation(card, "::after")).toBe("terria-ds-skeleton-shimmer");
    expect(animation(screen.getByTestId("image").element(), "::after")).toBe(
      "none"
    );
  });

  it("pulses as one with the skeletons it holds", async () => {
    const screen = await render(
      <Skeleton data-testid="card" animationType="pulse">
        <Skeleton data-testid="image" animationType="pulse" />
      </Skeleton>
    );

    expect(animation(screen.getByTestId("card").element())).toBe(
      "terria-ds-skeleton-pulse"
    );
    expect(animation(screen.getByTestId("image").element())).toBe("none");
  });
});
