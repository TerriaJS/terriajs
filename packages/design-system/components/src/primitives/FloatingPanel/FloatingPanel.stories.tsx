import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { mergeProps } from "react-aria/mergeProps";
import { useMove } from "react-aria/useMove";
import { FloatingPanel, FloatingPanelRoot } from ".";
import { Button } from "../Button";

const meta = {
  title: "Example/FloatingPanel",
  component: FloatingPanelRoot,
  // The panel takes its width from the map; centred, the map would shrink to
  // its content, which leaves the panel out
  parameters: { layout: "padded" },
  args: { placement: "top-end", size: "sm" },
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["top-start", "top-end", "bottom-start", "bottom-end"]
    },
    size: { control: "inline-radio", options: ["xs", "sm", "md"] }
  }
} satisfies Meta<typeof FloatingPanelRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stands in for the map: the panel floats over it, and it stays usable
const Map = ({ children }: { children: ReactNode }): React.ReactElement => (
  <div
    style={{
      position: "relative",
      blockSize: 480,
      padding: 16,
      borderRadius: 8,
      background: "var(--terria-ds-neutral-soft)"
    }}
  >
    {children}
  </div>
);

/**
 * A dialog over part of the page that leaves the rest usable: here the map's
 * button still counts presses while the panel is open. Escape from inside it,
 * or its close button, closes it.
 */
export const Default: Story = {
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(true);
    const [zooms, setZooms] = useState(0);
    return (
      <Map>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            onPress={() => {
              setIsOpen(true);
            }}
          >
            Show feature
          </Button>
          <Button
            variant="tertiary"
            onPress={() => {
              setZooms(zooms + 1);
            }}
          >
            Zoom in ({zooms})
          </Button>
        </div>
        <FloatingPanel {...args} isOpen={isOpen} onOpenChange={setIsOpen}>
          <FloatingPanel.CloseTrigger />
          <FloatingPanel.Header>
            <FloatingPanel.Heading>Sydney</FloatingPanel.Heading>
          </FloatingPanel.Header>
          <FloatingPanel.Body>
            Population 5,312,000. Area 12,368 km².
          </FloatingPanel.Body>
        </FloatingPanel>
      </Map>
    );
  }
};

/** Several can be open at once: the one used last comes to the front. */
export const Stacked: Story = {
  render: (args) => (
    <Map>
      <FloatingPanel {...args} defaultOpen placement="top-start">
        <FloatingPanel.CloseTrigger />
        <FloatingPanel.Header>
          <FloatingPanel.Heading>Sydney</FloatingPanel.Heading>
        </FloatingPanel.Header>
        <FloatingPanel.Body>Population 5,312,000.</FloatingPanel.Body>
      </FloatingPanel>
      <FloatingPanel
        {...args}
        defaultOpen
        placement="top-start"
        style={{ translate: "120px 80px" }}
      >
        <FloatingPanel.CloseTrigger />
        <FloatingPanel.Header>
          <FloatingPanel.Heading>Parramatta</FloatingPanel.Heading>
        </FloatingPanel.Header>
        <FloatingPanel.Body>Population 30,211.</FloatingPanel.Body>
      </FloatingPanel>
    </Map>
  )
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const DraggablePanel = (
  props: React.ComponentProps<typeof FloatingPanel>
): React.ReactElement => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Found when a drag starts, to measure against the map it's placed in
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  // useMove owns the gesture: pointer capture, text selection, ending it
  const { moveProps } = useMove({
    onMove: ({ deltaX, deltaY }) => {
      const map = panel?.offsetParent;
      let x = deltaX;
      let y = deltaY;
      // The step can't carry any edge past the map's
      if (panel && map) {
        const box = panel.getBoundingClientRect();
        const bounds = map.getBoundingClientRect();
        x = clamp(x, bounds.left - box.left, bounds.right - box.right);
        y = clamp(y, bounds.top - box.top, bounds.bottom - box.bottom);
      }
      setOffset((current) => ({ x: current.x + x, y: current.y + y }));
    }
  });
  const handleProps = mergeProps(moveProps, {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      setPanel(event.currentTarget.closest<HTMLElement>('[role="dialog"]'));
    }
  });

  return (
    <FloatingPanel
      {...props}
      style={{ translate: `${String(offset.x)}px ${String(offset.y)}px` }}
    >
      <FloatingPanel.CloseTrigger />
      <FloatingPanel.Header
        {...handleProps}
        style={{ cursor: "move", touchAction: "none" }}
      >
        <FloatingPanel.Heading>Sydney</FloatingPanel.Heading>
      </FloatingPanel.Header>
      <FloatingPanel.Body>
        Drag the title: the panel stops at the edges of the map.
      </FloatingPanel.Body>
    </FloatingPanel>
  );
};

/**
 * Spread the `moveProps` of React Aria's `useMove` (from
 * `react-aria/useMove`) onto `FloatingPanel.Header` to make it a drag handle,
 * and move the panel by the offset with `translate`.
 *
 * To keep it on the map, clamp each move so no edge of the panel passes its
 * positioned parent's, its `offsetParent`.
 */
export const Draggable: Story = {
  render: (args) => (
    <Map>
      <DraggablePanel {...args} defaultOpen />
    </Map>
  )
};
