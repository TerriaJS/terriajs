import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Input } from "../../Input";
import { Description, FieldError, Label, TextField } from "..";

describe("TextField width", () => {
  it("hugs its input, or fills its container with fullWidth", async () => {
    const screen = await render(
      <div style={{ inlineSize: 600 }}>
        <TextField data-testid="hug">
          <Label>Name</Label>
          <Input />
        </TextField>
        <TextField data-testid="fill" fullWidth>
          <Label>Name</Label>
          <Input />
        </TextField>
      </div>
    );

    const width = (id: string): number =>
      screen.getByTestId(id).element().getBoundingClientRect().width;
    expect(width("hug")).toBeLessThan(600);
    expect(width("fill")).toBe(600);
  });
});

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
