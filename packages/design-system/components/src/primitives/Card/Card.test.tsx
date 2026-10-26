import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Card } from ".";
import { Button } from "../Button";

describe("Card", () => {
  it("shows its title as a heading, with the description and footer", async () => {
    const screen = await render(
      <Card>
        <Card.Header>
          <Card.Title>Bushfire boundaries</Card.Title>
          <Card.Description>Updated daily from state agencies</Card.Description>
        </Card.Header>
        <Card.Content>Burnt areas for the current season</Card.Content>
        <Card.Footer>
          <Button>Add to map</Button>
        </Card.Footer>
      </Card>
    );

    await expect
      .element(
        screen.getByRole("heading", { level: 3, name: "Bushfire boundaries" })
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Updated daily from state agencies"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Burnt areas for the current season"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Add to map" }))
      .toBeVisible();
  });

  it("renders a part as another element, such as a title at another level", async () => {
    const screen = await render(
      <Card>
        <Card.Title
          render={({ children, ...props }) => <h2 {...props}>{children}</h2>}
        >
          Bushfire boundaries
        </Card.Title>
      </Card>
    );

    await expect
      .element(
        screen.getByRole("heading", { level: 2, name: "Bushfire boundaries" })
      )
      .toBeVisible();
  });

  it("forwards its ref to the card element", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <Card ref={ref} aria-label="Layer">
        Content
      </Card>
    );

    expect(ref.current).toBe(screen.getByLabelText("Layer").element());
  });
});
