import { useState, type ReactElement } from "react";
import { FocusScope } from "react-aria/FocusScope";
import {
  Dialog as AriaDialog,
  OverlayTriggerStateContext,
  type DialogProps as AriaDialogProps
} from "react-aria-components/Dialog";
import {
  useOverlayTriggerState,
  type OverlayTriggerProps
} from "react-stately/useOverlayTriggerState";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import "../Modal/Modal.css";
import "./FloatingPanel.css";

type FloatingPanelPlacement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end";
type FloatingPanelSize = "xs" | "sm" | "md";

type FloatingPanelProps = AriaDialogProps &
  OverlayTriggerProps & {
    placement?: FloatingPanelPlacement;
    size?: FloatingPanelSize;
  };

// The panel used last stacks above the others
let frontmost = 0;

// A dialog that floats over its positioned parent without taking over the
// page: focus moves into it when it opens, but isn't trapped there, and the
// page around it stays usable. Escape from inside it closes it, and focus
// goes back where it came from
const FloatingPanelRoot = ({
  isOpen,
  defaultOpen,
  onOpenChange,
  placement = "top-end",
  size = "sm",
  style,
  ...props
}: FloatingPanelProps): ReactElement | null => {
  const state = useOverlayTriggerState({ isOpen, defaultOpen, onOpenChange });
  const [zIndex, setZIndex] = useState(() => ++frontmost);
  const bringToFront = (): void => {
    if (zIndex !== frontmost) setZIndex(++frontmost);
  };

  if (!state.isOpen) return null;

  return (
    <OverlayTriggerStateContext.Provider value={state}>
      <ButtonGroupContext.Provider value={null}>
        <FocusScope restoreFocus>
          {/* The dialog passes on only pointer events, so its keys and focus
              are caught here, as they bubble out of it */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Only catches what bubbles up from the dialog inside it */}
          <div
            data-tds="floating-panel-root"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !event.isDefaultPrevented()) {
                event.stopPropagation();
                state.close();
              }
            }}
            onFocusCapture={bringToFront}
          >
            <AriaDialog
              {...props}
              style={{ ...style, zIndex }}
              data-tds="floating-panel"
              data-tds-placement={placement}
              data-tds-size={size}
            />
          </div>
        </FocusScope>
      </ButtonGroupContext.Provider>
    </OverlayTriggerStateContext.Provider>
  );
};

FloatingPanelRoot.displayName = "FloatingPanel";

export { FloatingPanelRoot };
export type { FloatingPanelPlacement, FloatingPanelProps, FloatingPanelSize };
