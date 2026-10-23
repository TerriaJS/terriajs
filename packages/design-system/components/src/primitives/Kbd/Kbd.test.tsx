import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Kbd } from ".";

describe("Kbd", () => {
  it("shows a shortcut as keyboard input, its modifier spelled out on hover", async () => {
    const screen = await render(
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    );
    const kbd = screen.container.querySelector("kbd");

    expect(kbd).toHaveTextContent("⌘K");
    expect(kbd?.querySelector("abbr")).toHaveAttribute("title", "Command");
  });
});
