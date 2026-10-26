import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleDashedIcon,
  EditIcon,
  MapPinIcon,
  PlusIcon
} from "@terria/design-system-icons";
import { Card } from ".";
import { figmaDesign } from "../../figma";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { CloseButton } from "../CloseButton";
import { Link } from "../Link";
import avatar from "./assets/avatar.jpg";
import banana from "./assets/banana.jpg";
import cactus from "./assets/cactus.jpg";
import cherry from "./assets/cherry.jpg";
import robot from "./assets/robot.jpg";
import satellite from "./assets/satellite.jpg";
import "./card.stories.css";

const meta = {
  title: "Example/Card",
  component: Card,
  parameters: figmaDesign("Card"),
  subcomponents: {
    "Card.Header": Card.Header,
    "Card.Title": Card.Title,
    "Card.Description": Card.Description,
    "Card.Content": Card.Content,
    "Card.Footer": Card.Footer
  },
  args: { variant: "default" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "secondary", "tertiary", "transparent"]
    }
  }
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="card-stories-basic">
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
  )
};

export const WithImage: Story = {
  render: (args) => (
    <Card {...args} className="card-stories-basic">
      <img src={cactus} alt="" className="card-stories-thumbnail" />
      <Card.Header>
        <Card.Title>Indie Hackers</Card.Title>
        <Card.Description>148 members</Card.Description>
      </Card.Header>
      <CloseButton />
      <Card.Footer>
        <img src={avatar} alt="" className="card-stories-avatar" />
        <Card.Description>By John</Card.Description>
      </Card.Footer>
    </Card>
  )
};

export const Horizontal: Story = {
  render: (args) => (
    <Card {...args} className="card-stories-horizontal">
      <img src={cherry} alt="" className="card-stories-side-image" />
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
  )
};

export const Item: Story = {
  render: (args) => (
    <Card {...args} className="card-stories-item">
      <img src={banana} alt="" className="card-stories-item-image" />
      <CloseButton />
      <Card.Footer className="card-stories-support">
        <Card.Title>Fruits</Card.Title>
        <span>18 pictures</span>
      </Card.Footer>
    </Card>
  )
};

// The image fills the card, under the header and footer
export const Cover: Story = {
  render: (args) => (
    <div className="card-stories-row">
      <Card {...args} className="card-stories-cover">
        <img src={satellite} alt="" className="card-stories-cover-image" />
        <CloseButton />
        <Card.Footer className="card-stories-cta">
          <div>
            <Card.Title>Available soon</Card.Title>
            <Card.Description>Get notified</Card.Description>
          </div>
          <Button variant="tertiary">Notify me</Button>
        </Card.Footer>
      </Card>
      <Card {...args} className="card-stories-cover">
        <img src={robot} alt="" className="card-stories-cover-image" />
        <CloseButton />
        <Card.Footer className="card-stories-cta">
          <div>
            <Card.Title>NEO</Card.Title>
            <Card.Description>$499/m</Card.Description>
          </div>
          <Button variant="tertiary">Get now</Button>
        </Card.Footer>
      </Card>
    </div>
  )
};

// A catalogue item, as in the workbench: an image with its status, its
// details, and what can be done with it
export const Dataset: Story = {
  render: (args) => (
    <Card {...args} className="card-stories-dataset">
      <Card.Header>
        <div className="card-stories-media">
          <img src={banana} alt="" className="card-stories-media-image" />
          <Chip color="success" variant="primary" size="sm">
            Trusted
          </Chip>
        </div>
        <div>
          <Card.Title>Name</Card.Title>
          <p className="card-stories-source">Source</p>
          <Card.Description>Updated Oct 2026</Card.Description>
        </div>
      </Card.Header>
      <Card.Footer>
        <Button variant="secondary" size="sm">
          <EditIcon />
          Edit
        </Button>
        <Button size="sm">
          <PlusIcon />
          Add to map
        </Button>
      </Card.Footer>
    </Card>
  )
};

export const Variants: Story = {
  render: () => (
    <div className="card-stories-row card-stories-backdrop">
      {(["default", "secondary", "tertiary", "transparent"] as const).map(
        (variant) => (
          <Card
            key={variant}
            variant={variant}
            className="card-stories-variant"
          >
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
        )
      )}
    </div>
  )
};
