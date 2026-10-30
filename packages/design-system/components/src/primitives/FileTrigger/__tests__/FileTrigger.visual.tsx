import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { FileUploadIcon } from "@terria/design-system-icons";
import { Button } from "../../Button";
import { focusVisible, hover, press, snap } from "../../../visual";
import { FileTrigger } from "..";

// It has no look of its own: its child is what people see, and its hidden
// input mustn't show or shift it
const upload = (): React.ReactElement => (
  <FileTrigger acceptedFileTypes={[".geojson", ".csv"]} allowsMultiple>
    <Button variant="secondary">
      <FileUploadIcon aria-hidden />
      Upload data
    </Button>
  </FileTrigger>
);

describe("FileTrigger", () => {
  it("default", async () => {
    await render(upload());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(upload());
    await hover(screen.getByRole("button"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(upload());
    await focusVisible(screen.getByRole("button"));
    await snap();
  });

  // Pressing opens the native file picker, which the screenshot doesn't
  // show; only the button's pressed look
  it("pressed", async () => {
    const screen = await render(upload());
    await press(screen.getByRole("button"));
    await snap();
  });
});
