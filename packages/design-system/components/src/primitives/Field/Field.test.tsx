import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Input } from "../Input";
import { Description, FieldError, Label, TextField } from ".";

describe("Field parts", () => {
  it("names and describes the field", async () => {
    const screen = await render(
      <TextField>
        <Label>Email</Label>
        <Input />
        <Description>We only use it for sign-in links</Description>
      </TextField>
    );

    await expect
      .element(screen.getByRole("textbox", { name: "Email" }))
      .toHaveAccessibleDescription("We only use it for sign-in links");
  });

  it("shows the error message only while the field is invalid", async () => {
    const field = (isInvalid: boolean): React.ReactElement => (
      <TextField isInvalid={isInvalid}>
        <Label>Email</Label>
        <Input />
        <FieldError>Enter a valid email</FieldError>
      </TextField>
    );
    const screen = await render(field(false));

    await expect
      .element(screen.getByText("Enter a valid email"))
      .not.toBeInTheDocument();

    await screen.rerender(field(true));

    await expect
      .element(screen.getByRole("textbox", { name: "Email" }))
      .toHaveAccessibleDescription("Enter a valid email");
  });
});
