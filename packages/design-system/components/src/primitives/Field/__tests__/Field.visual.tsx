import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { InfoCircleIcon } from "@terria/design-system-icons";
import { Input } from "../../Input";
import { TextArea } from "../../TextArea";
import { snap } from "../../../visual";
import { Description, ErrorMessage, FieldError, Label, TextField } from "..";

describe("Field", () => {
  it("default", async () => {
    await render(
      <TextField>
        <Label>Your name</Label>
        <Input placeholder="John" />
        <Description>We&apos;ll never share this with anyone else</Description>
      </TextField>
    );
    await snap();
  });

  it("required", async () => {
    await render(
      <TextField isRequired>
        <Label>Your name</Label>
        <Input placeholder="John" />
      </TextField>
    );
    await snap();
  });

  it("with an info icon", async () => {
    await render(
      <TextField isRequired>
        <Label>
          Your name
          <InfoCircleIcon aria-hidden size={12} />
        </Label>
        <Input placeholder="John" />
      </TextField>
    );
    await snap();
  });

  it("invalid", async () => {
    await render(
      <TextField isRequired isInvalid defaultValue="Mary387">
        <Label>Your name</Label>
        <Input />
        <Description>We&apos;ll never share this with anyone else</Description>
        <FieldError>Please enter only letters</FieldError>
      </TextField>
    );
    await snap();
  });

  it("disabled", async () => {
    await render(
      <TextField isRequired isDisabled>
        <Label>Your name</Label>
        <Input placeholder="John" />
        <Description>We&apos;ll never share this with anyone else</Description>
      </TextField>
    );
    await snap();
  });

  it("with a text area", async () => {
    await render(
      <TextField>
        <Label>Notes</Label>
        <TextArea placeholder="Add notes about this layer" />
        <Description>Shown to everyone who opens the layer</Description>
      </TextField>
    );
    await snap();
  });

  it("with an error message", async () => {
    await render(
      <TextField defaultValue="roads">
        <Label>Tags</Label>
        <Input />
        <ErrorMessage>Add at least two tags</ErrorMessage>
      </TextField>
    );
    await snap();
  });
});
