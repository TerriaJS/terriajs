import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { StackFrontIcon } from "@terria/design-system-icons";
import { snap } from "../../../visual";
import { Chip, type ChipColor, type ChipVariant } from "..";

const COLORS: ChipColor[] = [
  "default",
  "accent",
  "success",
  "warning",
  "danger"
];
const VARIANTS: ChipVariant[] = ["primary", "secondary", "tertiary", "soft"];

describe.each(VARIANTS)("Chip %s", (variant) => {
  it.each(COLORS)("%s", async (color) => {
    await render(
      <Chip variant={variant} color={color}>
        Satellite
      </Chip>
    );
    await snap();
  });
});

describe("Chip", () => {
  it.each(["sm", "md", "lg"] as const)("size %s", async (size) => {
    await render(
      <Chip size={size} color="accent" variant="soft">
        <StackFrontIcon />
        <Chip.Label>3 layers</Chip.Label>
      </Chip>
    );
    await snap();
  });

  it("a count", async () => {
    await render(<Chip size="sm">12</Chip>);
    await snap();
  });
});
