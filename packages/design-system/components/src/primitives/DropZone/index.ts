import { DropZoneLabel, DropZoneRoot } from "./DropZone";

// Compound component, assembled here so DropZone.tsx only exports components
export const DropZone = Object.assign(DropZoneRoot, {
  Root: DropZoneRoot,
  Label: DropZoneLabel
});

export { DropZoneLabel, DropZoneRoot };
export type { DropZoneLabelProps, DropZoneProps } from "./DropZone";
