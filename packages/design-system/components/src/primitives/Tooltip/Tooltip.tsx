import { mergeProps, useObjectRef } from "@react-aria/utils";
import {
  forwardRef,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import { useFocusable } from "react-aria/useFocusable";
import {
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  TooltipTriggerStateContext,
  type OverlayArrowProps,
  type TooltipProps as AriaTooltipProps,
  type TooltipTriggerComponentProps
} from "react-aria-components/Tooltip";
import { parseCSSTime } from "../../utils/parseCSSTime";
import { useCSSVariable } from "../../hooks/useCSSVariable";
import { dataAttr } from "../../utils/dataAttr";
import "./Tooltip.css";

// Shows the tooltip only once it's been asked to open for a frame. Tab in a
// toolbar-like group, such as a ToggleButtonGroup, focuses its last button and
// then leaves it in the same moment, which would otherwise flash that
// button's tooltip. React Aria skips the enter and exit animations while one
// tooltip replaces another; the fade is CSS-driven, so it's kept on swaps too
const TriggerStateScope = ({
  children,
  shouldSkipAnimation
}: {
  children: ReactNode;
  shouldSkipAnimation: boolean;
}): ReactNode => {
  const state = useContext(TooltipTriggerStateContext);
  const isOpen = state?.isOpen ?? false;
  const [hasStayedOpen, setHasStayedOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      setHasStayedOpen(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      setHasStayedOpen(false);
    };
  }, [isOpen]);

  if (!state) return children;
  return (
    <TooltipTriggerStateContext.Provider
      value={{
        ...state,
        isOpen: isOpen && hasStayedOpen,
        shouldSkipAnimation: shouldSkipAnimation && state.shouldSkipAnimation
      }}
    >
      {children}
    </TooltipTriggerStateContext.Provider>
  );
};

type TooltipRootProps = TooltipTriggerComponentProps & {
  /** Skip the fade when one tooltip replaces another */
  shouldSkipAnimation?: boolean;
};

// Shows Tooltip.Content while its trigger, a Button or Tooltip.Trigger, is
// hovered or has keyboard focus
const TooltipRoot = ({
  children,
  closeDelay,
  delay,
  shouldSkipAnimation = false,
  ...props
}: TooltipRootProps): React.ReactElement => {
  // The page can set the defaults with --terria-ds-tooltip-delay and
  // --terria-ds-tooltip-close-delay
  const cssDelay = useCSSVariable("--terria-ds-tooltip-delay");
  const cssCloseDelay = useCSSVariable("--terria-ds-tooltip-close-delay");

  return (
    <AriaTooltipTrigger
      {...props}
      closeDelay={closeDelay ?? parseCSSTime(cssCloseDelay)}
      delay={delay ?? parseCSSTime(cssDelay)}
    >
      <TriggerStateScope shouldSkipAnimation={shouldSkipAnimation}>
        {children}
      </TriggerStateScope>
    </AriaTooltipTrigger>
  );
};

TooltipRoot.displayName = "Tooltip";

type TooltipContentProps = AriaTooltipProps & {
  /** Dark surface, for tooltips over light content */
  isInverse?: boolean;
  /** Leaves room for a Tooltip.Arrow */
  showArrow?: boolean;
};

// Keeps the arrow off the rounded ends. 9px centres it on a one-line tooltip's
// side, (28px - 10px) / 2, and on taller ones keeps its corners under the curve
const ARROW_BOUNDARY_OFFSET = 9;

const TooltipContent = ({
  isInverse = false,
  showArrow = false,
  offset,
  arrowBoundaryOffset = ARROW_BOUNDARY_OFFSET,
  ...props
}: TooltipContentProps): React.ReactElement => {
  return (
    <AriaTooltip
      {...props}
      offset={offset ?? (showArrow ? 7 : 3)}
      arrowBoundaryOffset={arrowBoundaryOffset}
      data-tds="tooltip"
      data-tds-inverse={dataAttr(isInverse)}
    />
  );
};

TooltipContent.displayName = "Tooltip.Content";

type TooltipArrowProps = OverlayArrowProps;

const TooltipArrow = ({
  children,
  ...props
}: TooltipArrowProps): React.ReactElement => {
  return (
    <OverlayArrow {...props} data-tds="tooltip-arrow">
      {children ?? <span data-tds="tooltip-arrow-shape" />}
    </OverlayArrow>
  );
};

TooltipArrow.displayName = "Tooltip.Arrow";

type TooltipTriggerProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

// Lets content that isn't a button show the tooltip, like an icon or a badge.
// useFocusable rather than <Focusable>: the component's dev check warns
// wrongly when the trigger sits in an inert subtree, like behind a modal
const TooltipTrigger = forwardRef<HTMLDivElement, TooltipTriggerProps>(
  (props, forwardedRef) => {
    const triggerRef = useObjectRef(forwardedRef);
    const { focusableProps } = useFocusable({}, triggerRef);
    return (
      <div
        role="button"
        {...mergeProps(focusableProps, props)}
        ref={triggerRef}
        data-tds="tooltip-trigger"
      />
    );
  }
);

TooltipTrigger.displayName = "Tooltip.Trigger";

type TooltipProps = Omit<TooltipRootProps, "children"> &
  Pick<
    TooltipContentProps,
    "placement" | "offset" | "crossOffset" | "isInverse" | "showArrow"
  > & {
    /** The trigger: a Button, or Tooltip.Trigger around other content */
    children: ReactNode;
    content: ReactNode;
  };

// The everyday tooltip: its content, with an arrow pointing at the trigger
const Tooltip = ({
  children,
  content,
  placement,
  offset,
  crossOffset,
  isInverse,
  showArrow = true,
  ...props
}: TooltipProps): React.ReactElement => {
  return (
    <TooltipRoot {...props}>
      {children}
      <TooltipContent
        placement={placement}
        offset={offset}
        crossOffset={crossOffset}
        isInverse={isInverse}
        showArrow={showArrow}
      >
        {showArrow && <TooltipArrow />}
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
};

export { TooltipRoot, TooltipContent, TooltipArrow, TooltipTrigger, Tooltip };
export type {
  TooltipRootProps,
  TooltipContentProps,
  TooltipArrowProps,
  TooltipTriggerProps,
  TooltipProps
};
