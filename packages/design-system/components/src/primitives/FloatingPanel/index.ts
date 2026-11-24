import {
  ModalBody,
  ModalCloseTrigger,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon
} from "../Modal/Modal";
import { FloatingPanelRoot } from "./FloatingPanel";

// Compound component; its parts are the modal's, so the two look alike
export const FloatingPanel = Object.assign(FloatingPanelRoot, {
  Root: FloatingPanelRoot,
  CloseTrigger: ModalCloseTrigger,
  Header: ModalHeader,
  Icon: ModalIcon,
  Heading: ModalHeading,
  Body: ModalBody,
  Footer: ModalFooter
});

export { FloatingPanelRoot };
export type {
  FloatingPanelPlacement,
  FloatingPanelProps,
  FloatingPanelSize
} from "./FloatingPanel";
