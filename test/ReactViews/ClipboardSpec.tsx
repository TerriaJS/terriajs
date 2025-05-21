import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import Clipboard from "../../lib/ReactViews/Clipboard";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";

describe("Clipboard", function () {
  beforeAll(() => {
    jasmine.clock().install();
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it("should copy text to clipboard and show checkmark", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ThemeProvider theme={terriaTheme}>
        <Clipboard theme="dark" text="test" />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: "clipboard.copy" });
    expect(button).toBeVisible();

    await user.click(button);

    expect(screen.getByText("clipboard.success")).toBeVisible();
    expect(
      screen.queryByText("clipboard.unsuccessful")
    ).not.toBeInTheDocument();

    act(() => {
      jasmine.clock().tick(3000);
    });

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
        <Clipboard theme="dark" />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: "clipboard.copy" });
    await user.click(button);

    expect(screen.getByText("clipboard.unsuccessful")).toBeVisible();
    expect(screen.queryByText("clipboard.success")).not.toBeInTheDocument();

    // act(() => {
    jasmine.clock().tick(3000);
    // });

    expect(screen.queryByText("clipboard.success")).not.toBeInTheDocument();
    expect(
      screen.queryByText("clipboard.unsuccessful")
    ).not.toBeInTheDocument();
  });
});
