import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { KBD_KEYS, Kbd, type KbdKey, type KbdVariant } from "..";

const VARIANTS: KbdVariant[] = ["default", "light"];

describe.each(VARIANTS)("Kbd %s", (variant) => {
  it("modifier and key", async () => {
    await render(
      <Kbd variant={variant}>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    );
    await snap();
  });

  it("key alone", async () => {
    await render(
      <Kbd variant={variant}>
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    );
    await snap();
  });

  it("combination", async () => {
    await render(
      <Kbd variant={variant}>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Abbr keyValue="shift" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    );
    await snap();
  });

  it("in text", async () => {
    await render(
      <p>
        Press{" "}
        <Kbd variant={variant}>
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>{" "}
        to search the catalogue, or{" "}
        <Kbd variant={variant}>
          <Kbd.Abbr keyValue="escape" />
        </Kbd>{" "}
        to close it.
      </p>
    );
    await snap();
  });
});

describe("Kbd", () => {
  it("every key", async () => {
    await render(
      <p>
        {(Object.keys(KBD_KEYS) as KbdKey[]).map((key) => (
          <Kbd key={key}>
            <Kbd.Abbr keyValue={key} />
          </Kbd>
        ))}
      </p>
    );
    await snap();
  });
});
