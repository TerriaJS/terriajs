import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import type { InputVariant } from "../../Input";
import { focusVisible, hover, snap } from "../../../visual";
import { TextArea } from "../TextArea";

const VARIANTS: InputVariant[] = ["primary", "secondary"];
const NOTES =
  "Population counts by suburb from the 2021 census, updated every five years.";

describe.each(VARIANTS)("TextArea %s", (variant) => {
  it("empty", async () => {
    await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        placeholder="Add notes about this layer"
      />
    );
    await snap();
  });

  it("filled", async () => {
    await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        defaultValue={NOTES}
      />
    );
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        placeholder="Add notes about this layer"
      />
    );
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        placeholder="Add notes about this layer"
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        placeholder="Add notes about this layer"
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("invalid", async () => {
    await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        defaultValue="Too short"
        aria-invalid
      />
    );
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        defaultValue="Too short"
        aria-invalid
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(
      <TextArea
        variant={variant}
        aria-label="Layer notes"
        defaultValue="Read-only notes"
        disabled
      />
    );
    await snap();
  });
});

describe("TextArea", () => {
  it("five rows", async () => {
    await render(
      <TextArea aria-label="Layer notes" rows={5} defaultValue={NOTES} />
    );
    await snap();
  });
});
