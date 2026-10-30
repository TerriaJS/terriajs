import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { ListBox } from "../../ListBox";
import { Separator } from "../../Separator";
import { snap } from "../../../visual";
import { Header } from "../Header";

describe("Header", () => {
  it("titling list box sections", async () => {
    await render(
      <ListBox aria-label="Base maps">
        <ListBox.Section>
          <Header>Imagery</Header>
          <ListBox.Item>Satellite</ListBox.Item>
          <ListBox.Item>Aerial</ListBox.Item>
        </ListBox.Section>
        <Separator />
        <ListBox.Section>
          <Header>Danger zone</Header>
          <ListBox.Item variant="danger">Remove all layers</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    );
    await snap();
  });
});
