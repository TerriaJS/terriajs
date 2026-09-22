import {
  render,
  screen,
  waitForElementToBeRemoved
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import Clipboard from "../../lib/ReactViews/Clipboard";
import { TerriaThemeProvider } from "./withContext";

// Ideally those test would use a jasmine clock mock but it interferes with promise execution
// which needs the time to advance but it doesn't work with jasmine clock.
// We resolve it by setting the timeout to small value
describe("Clipboard", function () {
  it("should copy text to clipboard and show checkmark", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TerriaThemeProvider>
        <Clipboard text="test" timeout={100} />
      </TerriaThemeProvider>
    );

    const button = screen.getByRole("button", { name: "clipboard.copy" });
    expect(button).toBeVisible();

    await user.click(button);

    expect(screen.getByText("clipboard.success")).toBeVisible();
    expect(
      screen.queryByText("clipboard.unsuccessful")
    ).not.toBeInTheDocument();

    await waitForElementToBeRemoved(screen.queryByText("clipboard.success"));
    expect(screen.queryByText("clipboard.success")).not.toBeInTheDocument();

    expect(
      screen.queryByText("clipboard.unsuccessful")
    ).not.toBeInTheDocument();
  });

  it("should return null when clipboard is not available", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true
    });

    render(
      <TerriaThemeProvider>
        <Clipboard text="test" />
      </TerriaThemeProvider>
    );

    const button = screen.queryByRole("button", { name: "clipboard.copy" });
    expect(button).not.toBeInTheDocument();
  });

  it("should show error when copy fails", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TerriaThemeProvider>
        <Clipboard timeout={100} />
      </TerriaThemeProvider>
    );

    const button = screen.getByRole("button", { name: "clipboard.copy" });
    await user.click(button);

    expect(screen.getByText("clipboard.unsuccessful")).toBeVisible();
    expect(screen.queryByText("clipboard.success")).not.toBeInTheDocument();

    await waitForElementToBeRemoved(
      screen.queryByText("clipboard.unsuccessful")
    );
    expect(screen.queryByText("clipboard.success")).not.toBeInTheDocument();
    expect(
      screen.queryByText("clipboard.unsuccessful")
    ).not.toBeInTheDocument();
  });

  it("shows the created message once a result arrives", () => {
    const { rerender } = render(
      <TerriaThemeProvider>
        <Clipboard createdMessage="Saved as new story" />
      </TerriaThemeProvider>
    );
    // text goes from empty to a real result
    rerender(
      <TerriaThemeProvider>
        <Clipboard createdMessage="Saved as new story" text="https://short" />
      </TerriaThemeProvider>
    );

    expect(screen.getByText("Saved as new story")).toBeVisible();
  });

  it("does not show the created message when the result failed", () => {
    const { rerender } = render(
      <TerriaThemeProvider>
        <Clipboard createdMessage="Saved as new story" />
      </TerriaThemeProvider>
    );
    // text becomes non-empty (an error message), but it's flagged as a failure
    rerender(
      <TerriaThemeProvider>
        <Clipboard
          createdMessage="Saved as new story"
          text="Something went wrong"
          failed
        />
      </TerriaThemeProvider>
    );

    expect(screen.queryByText("Saved as new story")).not.toBeInTheDocument();
  });
});
