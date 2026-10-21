import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { CloseButton } from "./CloseButton";

describe("CloseButton", () => {
  it("is a button labelled Close with an X icon by default", async () => {
    const screen = await render(<CloseButton />);

    const button = screen.getByRole("button", { name: "Close" });
    await expect.element(button).toBeVisible();
    expect(button.element().querySelector("svg")).not.toBeNull();
  });

  it("takes a more specific label", async () => {
    const screen = await render(<CloseButton aria-label="Dismiss alert" />);

    await expect
      .element(screen.getByRole("button", { name: "Dismiss alert" }))
      .toBeVisible();
  });

  it("shows its children instead of the X icon", async () => {
    const screen = await render(
      <CloseButton>
        <span data-testid="custom-icon" />
      </CloseButton>
    );

    await expect.element(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button").element().querySelector("svg")
    ).toBeNull();
  });

  it("calls onPress when pressed", async () => {
    const onPress = vi.fn();
    const screen = await render(<CloseButton onPress={onPress} />);

    await screen.getByRole("button").click();

    expect(onPress).toHaveBeenCalledOnce();
  });
});
