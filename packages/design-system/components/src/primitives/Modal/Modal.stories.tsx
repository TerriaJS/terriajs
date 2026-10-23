import type { Meta, StoryObj } from "@storybook/react-vite";
import { StackFrontIcon, TrashIcon } from "@terria/design-system-icons";
import { useRef, useState } from "react";
import { mergeProps } from "react-aria/mergeProps";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { useMove } from "react-aria/useMove";
import { Button } from "../Button";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  type ModalBackdropVariant,
  type ModalPlacement,
  type ModalSize
} from ".";
import { figmaDesign } from "../../figma";

const SIZES: ModalSize[] = ["xs", "sm", "md", "lg", "cover", "full"];
const BACKDROPS: ModalBackdropVariant[] = ["opaque", "blur", "transparent"];
const PLACEMENTS: ModalPlacement[] = ["auto", "center", "top", "bottom"];

const meta = {
  title: "Example/Modal",
  component: ModalContainer,
  parameters: figmaDesign("Modal"),
  subcomponents: {
    ModalBackdrop,
    ModalDialog,
    ModalCloseTrigger,
    ModalHeader,
    ModalIcon,
    ModalHeading,
    ModalBody,
    ModalFooter
  },
  args: { size: "sm", placement: "center", scroll: "inside" },
  argTypes: {
    size: { control: "inline-radio", options: SIZES },
    placement: { control: "inline-radio", options: PLACEMENTS },
    scroll: { control: "inline-radio", options: ["inside", "outside"] }
  }
} satisfies Meta<typeof ModalContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Modal>
      <Button>Add data</Button>
      <Modal.Backdrop>
        <Modal.Container {...args}>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon>
                <StackFrontIcon />
              </Modal.Icon>
              <Modal.Heading>Add data to the map</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              Browse the catalogue, or upload a file from your computer.
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button slot="close">Browse catalogue</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {SIZES.map((size) => (
        <Modal key={size}>
          <Button variant="tertiary">{size}</Button>
          <Modal.Backdrop>
            <Modal.Container size={size}>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Size {size}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    {size === "cover" ? (
                      <>
                        This modal uses the <code>cover</code> size variant. It
                        spans the full screen with margins: 16px on mobile and
                        40px on desktop. Maintains rounded corners and standard
                        padding. Perfect for cover-style content that needs
                        maximum width while preserving modal aesthetics.
                      </>
                    ) : size === "full" ? (
                      <>
                        This modal uses the <code>full</code> size variant. It
                        occupies the entire viewport without any margins,
                        rounded corners, or shadows, creating a true fullscreen
                        experience. Ideal for immersive content or full-page
                        interactions.
                      </>
                    ) : (
                      <>
                        This modal uses the <code>{size}</code> size variant. On
                        mobile devices, all sizes adapt to near full-width for
                        optimal viewing. On desktop, each size provides a
                        different maximum width to suit various content needs.
                      </>
                    )}
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="tertiary">
                    Cancel
                  </Button>
                  <Button slot="close">Confirm</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  )
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {PLACEMENTS.map((placement) => (
        <Modal key={placement}>
          <Button variant="tertiary">{placement}</Button>
          <Modal.Backdrop>
            <Modal.Container placement={placement}>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Placement: {placement}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  This modal uses the {placement} placement option. Try
                  different placements to see how the modal positions itself on
                  the screen.
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="tertiary">
                    Cancel
                  </Button>
                  <Button slot="close">Confirm</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  )
};

// Something behind the modal, so the tint and blur show
const SWATCHES = ["primary", "warning", "success", "danger"].map(
  (name) => `var(--terria-ds-${name})`
);

const Page = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className="tds-flow" style={{ maxInlineSize: 640 }}>
    <h2>Flood extent 2022</h2>
    <div style={{ display: "flex", gap: 8 }}>
      {SWATCHES.map((color) => (
        <span
          key={color}
          style={{ flex: 1, blockSize: 64, borderRadius: 8, background: color }}
        />
      ))}
    </div>
    <p>
      Modelled extent of the 2022 floods, with gauge readings from the river
      network. Choose a backdrop to open the modal over this page.
    </p>
    {children}
  </div>
);

export const Backdrops: Story = {
  render: (args) => (
    <Page>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {BACKDROPS.map((variant) => (
          <Modal key={variant}>
            <Button variant="tertiary">{variant}</Button>
            <Modal.Backdrop variant={variant}>
              <Modal.Container {...args}>
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Backdrop {variant}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    Lorem ipsum dolor sit amet consectetur. Ultrices nunc
                    commodo dictumst fermentum.
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button slot="close">Confirm</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        ))}
      </div>
    </Page>
  )
};

const DISMISS = [
  { label: "Outside press and Escape", isDismissable: true, noEscape: false },
  { label: "Escape only", isDismissable: false, noEscape: false },
  { label: "Outside press only", isDismissable: true, noEscape: true },
  { label: "Buttons only", isDismissable: false, noEscape: true }
] as const;

/** What closes the modal besides its buttons. */
export const DismissBehavior: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {DISMISS.map(({ label, isDismissable, noEscape }) => (
        <Modal key={label}>
          <Button variant="tertiary">{label}</Button>
          <Modal.Backdrop
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={noEscape}
          >
            <Modal.Container {...args}>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>{label}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  Pressing outside {isDismissable ? "closes" : "doesn’t close"}{" "}
                  this modal, and Escape {noEscape ? "doesn’t" : "does"}.
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close">Done</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  )
};

const SaveView = (): React.ReactElement => {
  const [isSaving, setIsSaving] = useState(false);
  return (
    <Modal>
      <Button variant="tertiary">Render prop</Button>
      <Modal.Backdrop>
        <Modal.Container>
          {/* The render prop hands over close, to call when the work is done */}
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Save this view?</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  Closes once the save finishes, a second from now.
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    isPending={isSaving}
                    pendingLabel="Saving"
                    onPress={() => {
                      setIsSaving(true);
                      setTimeout(() => {
                        setIsSaving(false);
                        close();
                      }, 1000);
                    }}
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

const ControlledSettings = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        variant="tertiary"
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Controlled
      </Button>
      {/* No trigger inside: the open state lives in the parent */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Settings</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Opened and closed by the parent’s state.</Modal.Body>
              <Modal.Footer>
                <Button
                  onPress={() => {
                    setIsOpen(false);
                  }}
                >
                  Done
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
};

const CloseSlot = (): React.ReactElement => {
  return (
    <Modal>
      <Button variant="tertiary">Slot</Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Close with a slot</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              Any button with slot=&quot;close&quot; closes the modal it’s in.
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close">Got it</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

/**
 * #### Using `slot="close"`
 *
 * The simplest way to close a modal. Add `slot="close"` to any `Button`
 * component within the modal. When clicked, it will automatically close the
 * modal.
 *
 * #### Using Dialog render props
 *
 * Access the `close` method from the Dialog's render props. This gives you
 * full control over when and how to close the modal, allowing you to add
 * custom logic before closing.
 *
 * #### Controlled
 *
 * Control the modal using React's `useState` hook, passing `isOpen` and
 * `onOpenChange` to `Modal`. Perfect for basic use cases.
 */
export const CloseMethods: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <CloseSlot />
      <SaveView />
      <ControlledSettings />
    </div>
  )
};

const MapPanel = (): React.ReactElement => {
  const panelRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={panelRef}
      aria-label="Map panel"
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        inlineSize: 640,
        maxInlineSize: "100%",
        blockSize: 400,
        overflow: "hidden",
        borderRadius: 16,
        background: "var(--terria-ds-neutral)"
      }}
    >
      {/* Called when the modal opens, by which time the ref is set */}
      <UNSAFE_PortalProvider getContainer={() => panelRef.current}>
        <Modal>
          <Button>Layer settings</Button>
          <Modal.Backdrop style={{ position: "absolute", blockSize: "100%" }}>
            <Modal.Container>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Layer settings</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  This modal renders inside the map panel, not at the end of the
                  page.
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close">Done</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </UNSAFE_PortalProvider>
    </section>
  );
};

/**
 * By default a modal renders at the end of `document.body`. Wrap it in
 * `UNSAFE_PortalProvider` from `react-aria/PortalProvider` to render it into
 * another element instead, for example a panel with its own theme, or a
 * container that has to hold everything the app renders.
 *
 * The backdrop covers the whole window by default. To keep it within the
 * container, position the container and give the backdrop
 * `position: absolute` and the container's height.
 */
export const CustomPortal: Story = {
  render: () => <MapPanel />
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// Lives inside the container, so every opening starts centred again
const DraggableDialog = ({
  isContained
}: {
  isContained: boolean;
}): React.ReactElement => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Found when a drag starts, to measure against its backdrop
  const [dialog, setDialog] = useState<Element | null>(null);
  // useMove owns the gesture: pointer capture, text selection, ending it
  const { moveProps } = useMove({
    onMove: ({ deltaX, deltaY }) => {
      const backdrop = dialog?.closest('[data-tds="modal-backdrop"]');
      let x = deltaX;
      let y = deltaY;
      // Contained: the step can't carry any edge past the backdrop's
      if (isContained && dialog && backdrop) {
        const box = dialog.getBoundingClientRect();
        const bounds = backdrop.getBoundingClientRect();
        x = clamp(x, bounds.left - box.left, bounds.right - box.right);
        y = clamp(y, bounds.top - box.top, bounds.bottom - box.bottom);
      }
      setOffset((current) => ({ x: current.x + x, y: current.y + y }));
    }
  });
  const handleProps = mergeProps(moveProps, {
    onPointerDown: (event: React.PointerEvent) => {
      setDialog(event.currentTarget.closest('[role="dialog"]'));
    }
  });

  return (
    <Modal.Dialog
      style={{ translate: `${String(offset.x)}px ${String(offset.y)}px` }}
    >
      <Modal.CloseTrigger />
      <Modal.Header
        {...handleProps}
        style={{ cursor: "move", touchAction: "none" }}
      >
        <Modal.Heading>
          {isContained ? "Contained" : "Not contained"}
        </Modal.Heading>
      </Modal.Header>
      <Modal.Body>
        {isContained
          ? "Drag the title: the window stops at the edges of the screen."
          : "Drag the title: the window can go past the edges of the screen."}
      </Modal.Body>
      <Modal.Footer>
        <Button slot="close">Done</Button>
      </Modal.Footer>
    </Modal.Dialog>
  );
};

/**
 * Spread the `moveProps` of React Aria's `useMove` (from
 * `react-aria/useMove`) onto `Modal.Header` to make it a drag handle, and move
 * `Modal.Dialog` by the offset with `translate`. A transparent backdrop keeps
 * the page in view while it moves.
 *
 * To keep it on screen, clamp each move so no edge of the dialog passes the
 * backdrop's. Measuring the backdrop rather than the window keeps it working
 * inside a custom portal.
 */
export const Draggable: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[true, false].map((isContained) => (
        <Modal key={String(isContained)}>
          <Button variant="tertiary">
            {isContained ? "Contained" : "Not contained"}
          </Button>
          <Modal.Backdrop variant="transparent">
            <Modal.Container {...args}>
              <DraggableDialog isContained={isContained} />
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  )
};

/** A confirmation: centred, and only the buttons close it. */
export const CenteredHeader: Story = {
  render: (args) => (
    <Modal>
      <Button variant="danger">Remove layer</Button>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container {...args}>
          <Modal.Dialog role="alertdialog">
            <Modal.Header align="center">
              <Modal.Icon>
                <TrashIcon />
              </Modal.Icon>
              <Modal.Heading>Remove “Flood extent 2022”?</Modal.Heading>
            </Modal.Header>
            <Modal.Body style={{ textAlign: "center" }}>
              The layer and its styling will be removed from the map.
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button slot="close" variant="danger">
                Remove
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
};

export const ScrollInside: Story = {
  args: { scroll: "inside" },
  render: (args) => (
    <Modal>
      <Button>Read layer details</Button>
      <Modal.Backdrop>
        <Modal.Container {...args}>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Layer details</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {Array.from({ length: 40 }, (_, index) => (
                <p key={index}>
                  Detail {index + 1}: This layer contains geographic data for
                  the selected area. Review its coverage and source before
                  adding it to the map.
                </p>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close">Done</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
};

export const ScrollOutside: Story = {
  args: { scroll: "outside" },
  render: ScrollInside.render
};

// Open, for visual tests; Storybook leaves it closed until pressed
export const Opened: Story = {
  ...Default,
  tags: ["!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add data" }));
  }
};

// The wider sizes round more
export const OpenedMedium: Story = {
  ...Default,
  args: { size: "md" },
  tags: ["!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add data" }));
  }
};
