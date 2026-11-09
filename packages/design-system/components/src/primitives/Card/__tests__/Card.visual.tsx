import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { CircleDashedIcon, MapPinIcon } from "@terria/design-system-icons";
import { snap } from "../../../visual";
import { Button } from "../../Button";
import { CloseButton } from "../../CloseButton";
import { Link } from "../../Link";
import type { SurfaceVariant } from "../../Surface";
import { Card } from "..";
import "../card.stories.css";

const VARIANTS: SurfaceVariant[] = [
  "default",
  "secondary",
  "tertiary",
  "transparent"
];

const creator = (variant: SurfaceVariant): React.ReactElement => (
  <Card variant={variant} className="card-stories-basic">
    <CircleDashedIcon className="card-stories-icon" aria-hidden />
    <Card.Header>
      <div>
        <span className="card-stories-tagline">NEW</span>
        <Card.Title>Become a Terria creator</Card.Title>
      </div>
      <Card.Description>
        Share your maps and datasets, and see who explores them.
      </Card.Description>
    </Card.Header>
    <CloseButton />
    <Card.Footer>
      <Link href="https://terria.io" target="_blank">
        Call to action
        <Link.Icon />
      </Link>
    </Card.Footer>
  </Card>
);

const city = (variant: SurfaceVariant): React.ReactElement => (
  <Card variant={variant} className="card-stories-variant">
    <Card.Header>
      <Card.Title>Buenos Aires</Card.Title>
      <Card.Description>{variant}</Card.Description>
    </Card.Header>
    <Card.Footer>
      <Button size="sm">
        <MapPinIcon />
        Map
      </Button>
    </Card.Footer>
  </Card>
);

describe.each(VARIANTS)("Card %s", (variant) => {
  it("default", async () => {
    await render(creator(variant));
    await snap();
  });

  // Cards float over the map, which shows through the transparent one
  it("over a backdrop", async () => {
    await render(<div className="card-stories-backdrop">{city(variant)}</div>);
    await snap();
  });
});

describe("Card", () => {
  it("horizontal", async () => {
    await render(
      <Card className="card-stories-horizontal">
        <Card.Content>
          <Card.Header>
            <div>
              <span className="card-stories-tagline">NEW</span>
              <Card.Title>Become a Terria creator</Card.Title>
            </div>
            <Card.Description>
              Share your maps and datasets, and see who explores them.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Link href="https://terria.io" target="_blank">
              Call to action
              <Link.Icon />
            </Link>
          </Card.Footer>
        </Card.Content>
        <CloseButton />
      </Card>
    );
    await snap();
  });
});
