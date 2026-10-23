import type { Meta, StoryObj } from "@storybook/react-vite";
import { DownloadOffIcon, TrashIcon } from "@terria/design-system-icons";
import { Button } from "../Button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  type AlertDialogSize
} from ".";
import { figmaDesign } from "../../figma";

const SIZES: AlertDialogSize[] = ["xs", "sm", "md", "lg"];

const meta = {
  title: "Example/AlertDialog",
  component: AlertDialogContainer,
  parameters: figmaDesign("AlertDialog"),
  subcomponents: { AlertDialogBackdrop, AlertDialogDialog },
  args: { size: "sm", placement: "center" },
  argTypes: {
    size: { control: "inline-radio", options: SIZES },
    placement: {
      control: "inline-radio",
      options: ["auto", "center", "top", "bottom"]
    }
  }
} satisfies Meta<typeof AlertDialogContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Asks for a decision before something happens. Pressing outside doesn't
 * close it, so it can't be dismissed by accident; Escape and the close
 * button still cancel.
 */
export const Default: Story = {
  render: (args) => (
    <AlertDialog>
      <Button variant="danger">Remove layer</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container {...args}>
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon>
                <TrashIcon />
              </AlertDialog.Icon>
              <AlertDialog.Heading>
                Remove “Flood extent 2022”?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              The layer and its styling will be removed from the map. You can
              add it again from the catalogue.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button slot="close" variant="danger">
                Remove
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {SIZES.map((size) => (
        <AlertDialog key={size}>
          <Button variant="tertiary">{size}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container size={size}>
              <AlertDialog.Dialog>
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Heading>Size {size}</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  Lorem ipsum dolor sit amet consectetur. Ultrices nunc commodo
                  dictumst fermentum.
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary">
                    Cancel
                  </Button>
                  <Button slot="close">Confirm</Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </div>
  )
};

/**
 * A centred header, without a close button: one of the two actions has to be
 * chosen (or Escape pressed).
 */
export const CenteredHeader: Story = {
  render: (args) => (
    <AlertDialog>
      <Button>Go offline</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container {...args}>
          <AlertDialog.Dialog>
            <AlertDialog.Header align="center">
              <AlertDialog.Icon>
                <DownloadOffIcon />
              </AlertDialog.Icon>
              <AlertDialog.Heading>Work offline?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body style={{ textAlign: "center" }}>
              Layers that need a connection will stop updating until you are
              back online.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Stay online
              </Button>
              <Button slot="close">Go offline</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
};

/**
 * For a low-stakes question, `isDismissable` lets pressing outside cancel it,
 * as it does for a Modal.
 */
export const Dismissable: Story = {
  render: (args) => (
    <AlertDialog>
      <Button variant="tertiary">Reset view</Button>
      <AlertDialog.Backdrop isDismissable>
        <AlertDialog.Container {...args}>
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Heading>Reset the camera?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              The map returns to its starting view. Your layers stay as they
              are.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button slot="close">Reset</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
};

// Open, for visual tests; Storybook leaves it closed until pressed
export const Opened: Story = {
  ...Default,
  tags: ["!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove layer" }));
  }
};
