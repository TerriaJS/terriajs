import {
  render,
  screen,
  waitForElementToBeRemoved
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";
import Clipboard from "../../lib/ReactViews/Clipboard";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";

// Ideally those test would use a jasmine clock mock but it interferes with promise execution
// which needs the time to advance but it doesn't work with jasmine clock.
// We resolve it by setting the timeout to small value
describe("Clipboard", function () {
  it("should copy text to clipboard and show checkmark", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard text="test" timeout={100} />
      </ThemeProvider>
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
      <ThemeProvider theme={terriaTheme}>
        <Clipboard text="test" />
      </ThemeProvider>
    );

    const button = screen.queryByRole("button", { name: "clipboard.copy" });
    expect(button).not.toBeInTheDocument();
  });

  it("should show error when copy fails", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard timeout={100} />
      </ThemeProvider>
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
      <ThemeProvider theme={terriaTheme}>
        <Clipboard createdMessage="Saved as new story" />
      </ThemeProvider>
    );
    // text goes from empty to a real result
    rerender(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard createdMessage="Saved as new story" text="https://short" />
      </ThemeProvider>
    );

    expect(screen.getByText("Saved as new story")).toBeVisible();
  });

  it("does not show the created message when the result failed", () => {
    const { rerender } = render(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard createdMessage="Saved as new story" />
      </ThemeProvider>
    );
    // text becomes non-empty (an error message), but it's flagged as a failure
    rerender(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard
          createdMessage="Saved as new story"
          text="Something went wrong"
          failed
        />
      </ThemeProvider>
    );

    expect(screen.queryByText("Saved as new story")).not.toBeInTheDocument();
  });
});
