import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import {
  CopyIcon,
  MapPinIcon,
  SearchIcon,
  StackPlusIcon,
  UserIcon,
  WorldIcon
} from "@terria/design-system-icons";
import { Button } from "../../Button";
import { Chip } from "../../Chip";
import { Description, FieldError, Label, TextField } from "../../Field";
import type { InputVariant } from "../../Input";
import { Kbd } from "../../Kbd";
import { focusVisible, hover, press, snap } from "../../../visual";
import { InputGroup } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];

type PriceProps = {
  variant: InputVariant;
  isDivided?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
};

const price = ({
  variant,
  isDivided,
  isInvalid,
  isDisabled
}: PriceProps): React.ReactElement => (
  <TextField
    isInvalid={isInvalid}
    isDisabled={isDisabled}
    defaultValue={isInvalid ? "-5" : undefined}
  >
    <Label>Price</Label>
    <InputGroup variant={variant} isDivided={isDivided}>
      <InputGroup.Prefix>$</InputGroup.Prefix>
      <InputGroup.Input placeholder="0.00" />
      <InputGroup.Suffix>AUD</InputGroup.Suffix>
    </InputGroup>
    <FieldError>The price can&apos;t be negative</FieldError>
  </TextField>
);

const shareLink = (variant: InputVariant): React.ReactElement => (
  <TextField defaultValue="https://map.terria.io/#share=s-abc123" isReadOnly>
    <Label>Share link</Label>
    <InputGroup variant={variant}>
      <InputGroup.Prefix>
        <WorldIcon aria-hidden size={16} />
      </InputGroup.Prefix>
      <InputGroup.Input />
      <InputGroup.Suffix>
        <Button variant="ghost" size="sm" isIconOnly aria-label="Copy link">
          <CopyIcon aria-hidden size={16} />
        </Button>
      </InputGroup.Suffix>
    </InputGroup>
  </TextField>
);

describe.each(VARIANTS)("InputGroup %s", (variant) => {
  it("default", async () => {
    await render(price({ variant }));
    await snap();
  });

  it("divided", async () => {
    await render(price({ variant, isDivided: true }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(price({ variant }));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("divided and hovered", async () => {
    const screen = await render(price({ variant, isDivided: true }));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(price({ variant }));
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("invalid", async () => {
    await render(price({ variant, isInvalid: true }));
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(price({ variant, isInvalid: true }));
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(price({ variant, isDisabled: true }));
    await snap();
  });

  it("with a button", async () => {
    await render(shareLink(variant));
    await snap();
  });

  it("button hovered", async () => {
    const screen = await render(shareLink(variant));
    await hover(screen.getByRole("button", { name: "Copy link" }));
    await snap();
  });

  it("button pressed", async () => {
    const screen = await render(shareLink(variant));
    await press(screen.getByRole("button", { name: "Copy link" }));
    await snap();
  });

  it("button focused", async () => {
    const screen = await render(shareLink(variant));
    await focusVisible(screen.getByRole("button", { name: "Copy link" }));
    await snap();
  });
});

describe("InputGroup", () => {
  it("icon prefix", async () => {
    await render(
      <TextField>
        <Label>Username</Label>
        <InputGroup>
          <InputGroup.Prefix>
            <UserIcon aria-hidden size={16} />
          </InputGroup.Prefix>
          <InputGroup.Input placeholder="jane.citizen" />
        </InputGroup>
        <Description>Shown on the maps you share</Description>
      </TextField>
    );
    await snap();
  });

  it("icon suffix", async () => {
    await render(
      <TextField>
        <Label>Location</Label>
        <InputGroup>
          <InputGroup.Input placeholder="Address or coordinates" />
          <InputGroup.Suffix>
            <MapPinIcon aria-hidden size={16} />
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    await snap();
  });

  it("text prefix", async () => {
    await render(
      <TextField>
        <Label>Server</Label>
        <InputGroup>
          <InputGroup.Prefix>https://</InputGroup.Prefix>
          <InputGroup.Input placeholder="example.com/wms" />
        </InputGroup>
      </TextField>
    );
    await snap();
  });

  it("keyboard shortcut suffix", async () => {
    await render(
      <TextField aria-label="Search the catalogue">
        <InputGroup>
          <InputGroup.Prefix>
            <SearchIcon aria-hidden size={16} />
          </InputGroup.Prefix>
          <InputGroup.Input placeholder="Search the catalogue" />
          <InputGroup.Suffix>
            <Kbd variant="default">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    await snap();
  });

  it("chip suffix", async () => {
    await render(
      <TextField>
        <Label>Workspace</Label>
        <InputGroup>
          <InputGroup.Input placeholder="My workspace" />
          <InputGroup.Suffix>
            <Chip size="md" color="accent" variant="soft">
              <Chip.Label>Pro</Chip.Label>
            </Chip>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    await snap();
  });

  it.each([false, true])("text area, divided %s", async (isDivided) => {
    await render(
      <TextField>
        <Label>Story description</Label>
        <InputGroup isDivided={isDivided}>
          <InputGroup.Prefix>
            <UserIcon aria-hidden size={16} />
          </InputGroup.Prefix>
          <InputGroup.TextArea rows={3} placeholder="Describe this scene" />
          <InputGroup.Suffix>
            <Button variant="ghost" size="sm" isIconOnly aria-label="Copy">
              <CopyIcon aria-hidden size={16} />
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    await snap();
  });

  it.each([false, true])("vertical, divided %s", async (isDivided) => {
    await render(
      <TextField aria-label="Prompt">
        <InputGroup orientation="vertical" isDivided={isDivided}>
          <InputGroup.Prefix>
            <Button variant="outline" size="sm">
              <StackPlusIcon aria-hidden size={16} />
              Add layers
            </Button>
          </InputGroup.Prefix>
          <InputGroup.TextArea rows={4} placeholder="Ask about this map" />
          <InputGroup.Suffix>
            <Button variant="tertiary" size="sm" isIconOnly aria-label="Link">
              <WorldIcon aria-hidden size={16} />
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    );
    await snap();
  });
});
