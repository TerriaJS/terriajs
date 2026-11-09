import { forwardRef } from "react";
import {
  DropZone as AriaDropZone,
  Text as AriaText,
  type DropZoneProps as AriaDropZoneProps,
  type TextProps as AriaTextProps
} from "react-aria-components/DropZone";
import "./DropZone.css";

type DropZoneProps = AriaDropZoneProps;

// Takes files and other data dropped on it, or pasted into it from the
// keyboard, and passes them to onDrop. Its look comes from where it's used:
// data-drop-target is set while something is dragged over it
const DropZoneRoot = forwardRef<HTMLDivElement, DropZoneProps>((props, ref) => {
  return <AriaDropZone {...props} ref={ref} data-tds="drop-zone" />;
});

DropZoneRoot.displayName = "DropZone";

type DropZoneLabelProps = Omit<AriaTextProps, "slot">;

// Names the drop zone for screen readers
const DropZoneLabel = forwardRef<HTMLElement, DropZoneLabelProps>(
  (props, ref) => {
    return (
      <AriaText {...props} ref={ref} slot="label" data-tds="drop-zone-label" />
    );
  }
);

DropZoneLabel.displayName = "DropZone.Label";

export { DropZoneRoot, DropZoneLabel };
export type { DropZoneProps, DropZoneLabelProps };
