import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { CircleDashedIcon, StackFrontIcon } from "@terria/design-system-icons";
import { snap } from "../../../visual";
import { Button } from "../../Button";
import {
  Badge,
  type BadgeColor,
  type BadgePlacement,
  type BadgeVariant
} from "..";

const COLORS: BadgeColor[] = [
  "default",
  "accent",
  "success",
  "warning",
  "danger"
];
const VARIANTS: BadgeVariant[] = ["primary", "secondary", "soft"];
const PLACEMENTS: BadgePlacement[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left"
];

describe.each(VARIANTS)("Badge %s", (variant) => {
  it.each(COLORS)("%s", async (color) => {
    await render(
      <Badge variant={variant} color={color}>
        5
      </Badge>
    );
    await snap();
  });
});

describe("Badge", () => {
  it.each(["sm", "md", "lg"] as const)("size %s", async (size) => {
    await render(
      <Badge size={size} color="accent">
        <CircleDashedIcon />
        <Badge.Label>New</Badge.Label>
      </Badge>
    );
    await snap();
  });

  it.each(PLACEMENTS)("on a button, %s", async (placement) => {
    await render(
      <Badge.Anchor>
        <Button variant="tertiary" isIconOnly aria-label="Layers">
          <StackFrontIcon size={16} />
        </Button>
        <Badge size="sm" color="danger" placement={placement}>
          5
        </Badge>
      </Badge.Anchor>
    );
    await snap();
  });

  it("a dot", async () => {
    await render(
      <Badge.Anchor>
        <Button variant="tertiary" isIconOnly aria-label="Layers">
          <StackFrontIcon size={16} />
        </Button>
        <Badge size="sm" color="danger" />
      </Badge.Anchor>
    );
    await snap();
  });

  it("a long count", async () => {
    await render(<Badge color="danger">99+</Badge>);
    await snap();
  });
});
