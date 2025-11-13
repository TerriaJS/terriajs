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
        <Clipboard theme="dark" text="test" timeout={100} />
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
        <Clipboard theme="dark" text="test" />
      </ThemeProvider>
    );

    const button = screen.queryByRole("button", { name: "clipboard.copy" });
    expect(button).not.toBeInTheDocument();
  });

  it("should show error when copy fails", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard theme="dark" timeout={100} />
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
});
