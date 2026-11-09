import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon
} from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import "./Alert.css";

type AlertStatus = "default" | "accent" | "success" | "warning" | "danger";

const AlertContext = createContext<AlertStatus>("default");

const STATUS_ICONS = {
  default: AlertCircleIcon,
  accent: AlertCircleIcon,
  success: CheckIcon,
  warning: AlertTriangleIcon,
  danger: AlertCircleIcon
} satisfies Record<AlertStatus, unknown>;

// Like react-aria components, each part takes `render` to swap in a custom
// element of the same type, e.g. an animated or pre-styled one. Parts use
// forwardRef: React 18 doesn't pass `ref` to plain function components
type PartProps<E extends "div" | "p" | "span"> = ComponentPropsWithoutRef<E> &
  DOMRenderProps<E, undefined>;

// Required: an alert with nothing in it is a mistake
type AlertProps = PartProps<"div"> & {
  children: ReactNode;
  status?: AlertStatus;
};

// An inline, persistent message tied to content. Pass role="alert" or
// role="status" when it appears in response to something
const AlertRoot = forwardRef<HTMLDivElement, AlertProps>(
  ({ status = "default", render, ...props }, ref) => {
    const rootProps = {
      ...props,
      ref,
      "data-tds": "alert",
      "data-tds-status": status
    };

    return (
      <AlertContext.Provider value={status}>
        {render ? render(rootProps, undefined) : <div {...rootProps} />}
      </AlertContext.Provider>
    );
  }
);

AlertRoot.displayName = "Alert";

type AlertIndicatorProps = PartProps<"div">;

// The status icon, unless children replace it
const AlertIndicator = forwardRef<HTMLDivElement, AlertIndicatorProps>(
  ({ children, render, ...props }, ref) => {
    const Icon = STATUS_ICONS[useContext(AlertContext)];
    const icon = children ?? <Icon />;
    const indicatorProps = {
      "aria-hidden": true,
      ...props,
      ref,
      "data-tds": "alert-indicator"
    };

    return render ? (
      render({ ...indicatorProps, children: icon }, undefined)
    ) : (
      <div {...indicatorProps}>{icon}</div>
    );
  }
);

AlertIndicator.displayName = "Alert.Indicator";

type AlertContentProps = PartProps<"div"> & { children: ReactNode };

const AlertContent = forwardRef<HTMLDivElement, AlertContentProps>(
  ({ render, ...props }, ref) => {
    const contentProps = { ...props, ref, "data-tds": "alert-content" };
    return render ? render(contentProps, undefined) : <div {...contentProps} />;
  }
);

AlertContent.displayName = "Alert.Content";

type AlertTitleProps = PartProps<"p"> & { children: ReactNode };

const AlertTitle = forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ render, ...props }, ref) => {
    const titleProps = { ...props, ref, "data-tds": "alert-title" };
    return render ? render(titleProps, undefined) : <p {...titleProps} />;
  }
);

AlertTitle.displayName = "Alert.Title";

type AlertDescriptionProps = PartProps<"span">;

const AlertDescription = forwardRef<HTMLSpanElement, AlertDescriptionProps>(
  ({ render, ...props }, ref) => {
    const descriptionProps = { ...props, ref, "data-tds": "alert-description" };
    return render ? (
      render(descriptionProps, undefined)
    ) : (
      <span {...descriptionProps} />
    );
  }
);

AlertDescription.displayName = "Alert.Description";

export {
  AlertRoot,
  AlertIndicator,
  AlertContent,
  AlertTitle,
  AlertDescription
};
export type {
  AlertStatus,
  AlertProps,
  AlertIndicatorProps,
  AlertContentProps,
  AlertTitleProps,
  AlertDescriptionProps
};
