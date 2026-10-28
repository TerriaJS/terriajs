import { mergeRefs } from "@react-aria/utils";
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogProps as AriaDialogProps,
  type DialogTriggerProps as AriaDialogTriggerProps
} from "react-aria-components/Dialog";
import {
  Heading as AriaHeading,
  type HeadingProps as AriaHeadingProps
} from "react-aria-components/Heading";
import {
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps
} from "react-aria-components/Modal";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { useDrawerDrag, type DrawerPlacement } from "./useDrawerDrag";
import { dataAttr } from "../../utils/dataAttr";
import "../Modal/Modal.css";
import "./Drawer.css";

type DrawerContextValue = {
  placement?: DrawerPlacement;
  isDismissable?: boolean;
};

// The placement and dismissability the dialog's drag follows
const DrawerContext = createContext<DrawerContextValue>({});

type DrawerRootProps = AriaDialogTriggerProps;

// A panel that slides in from an edge of the screen: the first child opens
// it, and Drawer.Backdrop holds Content, Dialog and its parts
const DrawerRoot = (props: DrawerRootProps): React.ReactElement => {
  return <AriaDialogTrigger {...props} />;
};

DrawerRoot.displayName = "Drawer";

type DrawerTriggerProps = AriaButtonProps;

// Opens the drawer, when the opener isn't a Button of its own
const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  (props, ref) => {
    return <AriaButton {...props} ref={ref} data-tds="drawer-trigger" />;
  }
);

DrawerTrigger.displayName = "Drawer.Trigger";

type DrawerBackdropVariant = "opaque" | "blur" | "transparent";

type DrawerBackdropProps = AriaModalOverlayProps & {
  variant?: DrawerBackdropVariant;
};

// The page behind, dimmed; pressing it closes the drawer unless
// isDismissable is false, which also stops it being dragged away
const DrawerBackdrop = ({
  children,
  isDismissable = true,
  variant = "opaque",
  ...props
}: DrawerBackdropProps): React.ReactElement => {
  const context = useMemo(() => ({ isDismissable }), [isDismissable]);

  return (
    <AriaModalOverlay
      {...props}
      isDismissable={isDismissable}
      data-tds="drawer-backdrop"
      data-tds-variant={variant}
    >
      {(renderProps) => (
        <DrawerContext.Provider value={context}>
          {typeof children === "function" ? children(renderProps) : children}
        </DrawerContext.Provider>
      )}
    </AriaModalOverlay>
  );
};

DrawerBackdrop.displayName = "Drawer.Backdrop";

type DrawerContentProps = Omit<
  AriaModalOverlayProps,
  "isDismissable" | "isKeyboardDismissDisabled"
> & {
  placement?: DrawerPlacement;
};

// Places the dialog against an edge of the screen
const DrawerContent = ({
  children,
  placement = "bottom",
  ...props
}: DrawerContentProps): React.ReactElement => {
  const { isDismissable } = useContext(DrawerContext);
  const context = useMemo(
    () => ({ placement, isDismissable }),
    [placement, isDismissable]
  );

  return (
    <ButtonGroupContext.Provider value={null}>
      <AriaModal
        {...props}
        data-tds="drawer-content"
        data-tds-placement={placement}
      >
        {(renderProps) => (
          <DrawerContext.Provider value={context}>
            {typeof children === "function" ? children(renderProps) : children}
          </DrawerContext.Provider>
        )}
      </AriaModal>
    </ButtonGroupContext.Provider>
  );
};

DrawerContent.displayName = "Drawer.Content";

type DrawerDialogProps = AriaDialogProps;

// The drawer itself; dragged from its handle, header or footer towards its
// edge, it closes
const DrawerDialog = forwardRef<HTMLElement, DrawerDialogProps>(
  (props, ref) => {
    const { isDismissable = true, placement } = useContext(DrawerContext);
    const { dialogRef, dragHandlers } = useDrawerDrag(placement, isDismissable);
    const mergedRef = useMemo(
      () => mergeRefs(dialogRef, ref),
      [dialogRef, ref]
    );

    return (
      <AriaDialog
        {...dragHandlers}
        {...props}
        ref={mergedRef}
        data-tds="drawer-dialog"
        data-tds-placement={placement}
        data-tds-dismissable={dataAttr(isDismissable)}
      />
    );
  }
);

DrawerDialog.displayName = "Drawer.Dialog";

type PartProps = ComponentPropsWithoutRef<"div"> &
  DOMRenderProps<"div", undefined>;

// The heading, and anything beside it
const DrawerHeader = forwardRef<HTMLDivElement, PartProps>(
  ({ render, ...props }, ref) => {
    const headerProps = { ...props, ref, "data-tds": "drawer-header" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
      render(headerProps, undefined)
    ) : (
      <div {...headerProps} />
    );
  }
);

DrawerHeader.displayName = "Drawer.Header";

// What the drawer holds; it scrolls, so it doesn't start a drag
const DrawerBody = forwardRef<HTMLDivElement, PartProps>(
  ({ render, ...props }, ref) => {
    const bodyProps = { ...props, ref, "data-tds": "drawer-body" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
      render(bodyProps, undefined)
    ) : (
      <div {...bodyProps} />
    );
  }
);

DrawerBody.displayName = "Drawer.Body";

// Its actions, at the end
const DrawerFooter = forwardRef<HTMLDivElement, PartProps>(
  ({ render, ...props }, ref) => {
    const footerProps = { ...props, ref, "data-tds": "drawer-footer" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
      render(footerProps, undefined)
    ) : (
      <div {...footerProps} />
    );
  }
);

DrawerFooter.displayName = "Drawer.Footer";

// A bar showing it can be dragged; decorative
const DrawerHandle = forwardRef<HTMLDivElement, PartProps>(
  ({ render, ...props }, ref) => {
    const handleProps = {
      ...props,
      ref,
      "aria-hidden": true,
      "data-tds": "drawer-handle"
    };
    const bar = <div data-tds="drawer-handle-bar" />;
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
      render({ ...handleProps, children: bar }, undefined)
    ) : (
      <div {...handleProps}>{bar}</div>
    );
  }
);

DrawerHandle.displayName = "Drawer.Handle";

type DrawerHeadingProps = AriaHeadingProps;

// Names the dialog
const DrawerHeading = forwardRef<HTMLHeadingElement, DrawerHeadingProps>(
  (props, ref) => {
    return (
      <AriaHeading
        slot="title"
        {...props}
        ref={ref}
        data-tds="drawer-heading"
      />
    );
  }
);

DrawerHeading.displayName = "Drawer.Heading";

type DrawerCloseTriggerProps = CloseButtonProps;

// Closes the drawer; it sits in the dialog's corner
const DrawerCloseTrigger = (
  props: DrawerCloseTriggerProps
): React.ReactElement => {
  return <CloseButton slot="close" {...props} />;
};

DrawerCloseTrigger.displayName = "Drawer.CloseTrigger";

export {
  DrawerRoot,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerHeading,
  DrawerBody,
  DrawerFooter,
  DrawerHandle,
  DrawerCloseTrigger
};
export type {
  DrawerRootProps,
  DrawerTriggerProps,
  DrawerBackdropProps,
  DrawerBackdropVariant,
  DrawerContentProps,
  DrawerDialogProps,
  PartProps as DrawerHeaderProps,
  PartProps as DrawerBodyProps,
  PartProps as DrawerFooterProps,
  PartProps as DrawerHandleProps,
  DrawerHeadingProps,
  DrawerCloseTriggerProps,
  DrawerPlacement
};
