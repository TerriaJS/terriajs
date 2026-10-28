import { mergeRefs, useLayoutEffect } from "@react-aria/utils";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon
} from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode
} from "react";
import { useFocusVisible } from "react-aria/useFocusVisible";
import { composeRenderProps } from "react-aria-components/composeRenderProps";
import { Text, type TextProps } from "react-aria-components/Text";
import {
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastRegion as AriaToastRegion,
  UNSTABLE_ToastStateContext as ToastStateContext,
  type QueuedToast,
  type ToastProps as AriaToastProps,
  type ToastRegionProps as AriaToastRegionProps
} from "react-aria-components/Toast";
import { Button, type ButtonProps } from "../Button";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { Spinner } from "../Spinner";
import { dataAttr } from "../../utils/dataAttr";
import {
  DEFAULT_GAP,
  DEFAULT_HOTKEY,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_TOAST_WIDTH
} from "./constants";
import {
  ToastQueue,
  isExitAwareToastQueue,
  toast as defaultToast,
  type StatelyToastQueue,
  type ToastContentValue
} from "./ToastQueue";
import { useMeasuredHeight } from "../../hooks/useMeasuredHeight";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import "./Toast.css";

type ToastVariant = NonNullable<ToastContentValue["variant"]>;
type ToastPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end";

type ToastContextValue = {
  placement?: ToastPlacement;
  scaleFactor?: number;
  gap?: number;
  maxVisibleToasts?: number;
  heightsByKey?: Record<string, number>;
  // Keys of toasts playing their exit animation
  exitingKeys?: ReadonlySet<string>;
  isExpanded?: boolean;
  onToastHeightChange?: (key: string, height: number) => void;
  onToastHeightRemove?: (key: string) => void;
};

const ToastContext = createContext<ToastContextValue>({});

// The KeyboardEvent boolean props a hotkey entry can name; anything else is
// an event.code
const MODIFIER_PROPS = ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const;

const EMPTY_EXITING_KEYS: ReadonlySet<string> = new Set();
const NO_TOASTS: readonly QueuedToast<never>[] = [];
const getEmptyExitingKeys = (): ReadonlySet<string> => EMPTY_EXITING_KEYS;
const subscribeToNothing = (): (() => void) => () => undefined;

// When a focused toast goes: pointer focus leaves the region, so hover
// collapse and timers stay live; keyboard focus moves to the nearest
// remaining toast, newer first, as React Aria does
const moveFocusFromToast = (
  toastEl: HTMLElement,
  isKeyboardFocus: boolean
): void => {
  if (!isKeyboardFocus) {
    (document.activeElement as HTMLElement | null)?.blur();
    return;
  }

  const isViable = (el: Element | null): el is HTMLElement =>
    el instanceof HTMLElement &&
    el.matches('[data-tds="toast"]:not([data-exiting]):not([data-hidden])');

  // The nearest newer toast (earlier siblings: newest come first), else the
  // nearest older one
  let target: HTMLElement | null = null;
  for (
    let sibling = toastEl.previousElementSibling;
    sibling && !target;
    sibling = sibling.previousElementSibling
  ) {
    if (isViable(sibling)) target = sibling;
  }
  for (
    let sibling = toastEl.nextElementSibling;
    sibling && !target;
    sibling = sibling.nextElementSibling
  ) {
    if (isViable(sibling)) target = sibling;
  }

  if (target) {
    target.focus();
  } else {
    (document.activeElement as HTMLElement | null)?.blur();
  }
};

type ToastProps<T extends object = ToastContentValue> = AriaToastProps<T> & {
  variant?: ToastVariant;
  placement?: ToastPlacement;
  /** How much each toast behind the front one scales down; by default the
   * provider's */
  scaleFactor?: number;
};

// One toast in the stack: it places itself by its index, and is marked
// while entering, exiting, hidden beyond the visible few, or expanded
const ToastInner = <T extends object = ToastContentValue>(
  {
    children,
    placement,
    scaleFactor,
    style,
    toast,
    variant = "default",
    ...rest
  }: ToastProps<T>,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement => {
  const {
    exitingKeys,
    gap = DEFAULT_GAP,
    heightsByKey,
    isExpanded = false,
    maxVisibleToasts = DEFAULT_MAX_VISIBLE_TOAST,
    onToastHeightChange,
    onToastHeightRemove,
    placement: contextPlacement,
    scaleFactor: contextScaleFactor
  } = useContext(ToastContext);

  const finalPlacement = placement ?? contextPlacement;
  const finalScaleFactor =
    scaleFactor ?? contextScaleFactor ?? DEFAULT_SCALE_FACTOR;

  // One empty list, not a new one each render, which would redo the layout
  const visibleToasts = (useContext(ToastStateContext)?.visibleToasts ??
    NO_TOASTS) as readonly QueuedToast<T>[];
  const toastKey = toast.key;
  const isExiting = exitingKeys?.has(toastKey) ?? false;

  // Exiting toasts leave the layout, so the others close up while it fades,
  // but it keeps its own place
  const layoutToasts = useMemo(() => {
    if (!exitingKeys || exitingKeys.size === 0) return visibleToasts;
    return visibleToasts.filter(
      (t) => !exitingKeys.has(t.key) || t.key === toastKey
    );
  }, [exitingKeys, toastKey, visibleToasts]);

  const fullIndex = visibleToasts.indexOf(toast);
  const index = layoutToasts.indexOf(toast);
  const isFrontmost = index <= 0;
  const isHidden = !isExiting && index >= maxVisibleToasts;
  const toastRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(toastRef, ref), [ref]);
  const { height: toastHeight } = useMeasuredHeight(toastRef);
  const { isFocusVisible } = useFocusVisible();
  const [isEntering, setIsEntering] = useState(true);

  // Marked entering for its first frame, so it slides in from there
  useEffect(() => {
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setIsEntering(false);
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, []);

  // Before the first paint, so the others have its height in time
  useLayoutEffect(() => {
    if (typeof toastHeight === "number") {
      onToastHeightChange?.(toastKey, toastHeight);
    }
  }, [toastKey, toastHeight, onToastHeightChange]);

  useEffect(
    () => () => {
      onToastHeightRemove?.(toastKey);
    },
    [toastKey, onToastHeightRemove]
  );

  // React Aria filters tabIndex and aria-hidden out of a toast's props, so
  // they're set on the element
  useLayoutEffect(() => {
    const el = toastRef.current;
    if (!el) return;

    el.tabIndex =
      isFrontmost || (isExpanded && !isHidden && !isExiting) ? 0 : -1;

    if (isHidden || isExiting) {
      // Browsers block aria-hidden around focus, so focus moves out first
      if (el.contains(document.activeElement)) {
        moveFocusFromToast(el, isFocusVisible);
      }
      el.setAttribute("aria-hidden", "true");

      if (isExiting) {
        // Its controls leave the tab order. Not inert: pointer events must
        // keep reaching it, so the stack stays open under a resting pointer
        for (const control of el.querySelectorAll<HTMLElement>("button, a")) {
          control.tabIndex = -1;
        }
      } else {
        // Hidden toasts can show again, and inert is reversible
        el.setAttribute("inert", "");
      }
    } else {
      el.removeAttribute("aria-hidden");
      el.removeAttribute("inert");
    }
  }, [isFrontmost, isExpanded, isHidden, isExiting, isFocusVisible]);

  const stackingStyle = useMemo<CSSProperties>(() => {
    const frontToastKey = layoutToasts[0]?.key;
    const frontHeight =
      (frontToastKey ? heightsByKey?.[frontToastKey] : undefined) ??
      toastHeight ??
      0;

    let heightsBefore = 0;
    for (const before of layoutToasts.slice(0, Math.max(0, index))) {
      heightsBefore += heightsByKey?.[before.key] ?? frontHeight;
    }

    return {
      "--terria-ds-toast-offset-collapsed": `${String(index * gap)}px`,
      "--terria-ds-toast-offset-expanded": `${String(heightsBefore + index * gap)}px`,
      "--terria-ds-toast-scale-collapsed": String(1 - index * finalScaleFactor),
      "--terria-ds-toast-front-height": `${String(frontHeight)}px`,
      ...(typeof toastHeight === "number"
        ? { "--terria-ds-toast-height": `${String(toastHeight)}px` }
        : null),
      zIndex: isExiting ? 0 : visibleToasts.length - fullIndex
    } as CSSProperties;
  }, [
    finalScaleFactor,
    fullIndex,
    gap,
    heightsByKey,
    index,
    isExiting,
    layoutToasts,
    toastHeight,
    visibleToasts.length
  ]);

  const toastStyle = composeRenderProps(style, (userStyle) => ({
    ...stackingStyle,
    ...userStyle
  }));

  return (
    <AriaToast<T>
      {...rest}
      ref={mergedRef}
      toast={toast}
      style={toastStyle}
      data-tds="toast"
      data-tds-variant={variant}
      data-tds-placement={finalPlacement}
      data-entering={dataAttr(isEntering)}
      data-exiting={dataAttr(isExiting)}
      data-expanded={dataAttr(isExpanded)}
      data-frontmost={dataAttr(isFrontmost)}
      data-hidden={dataAttr(isHidden)}
      data-index={index}
    >
      {children}
    </AriaToast>
  );
};

const Toast = forwardRef(ToastInner) as (<T extends object = ToastContentValue>(
  props: ToastProps<T> & { ref?: ForwardedRef<HTMLDivElement> }
) => ReactElement) & { displayName?: string };

Toast.displayName = "Toast";

// An interface keeps this name in the published types. React Aria doesn't
// export the props type it extends, so an alias would be expanded into it
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- see above
interface ToastContentProps extends ComponentPropsWithoutRef<
  typeof AriaToastContent
> {}

// The title and description, and on narrow screens the action
const ToastContent = forwardRef<HTMLDivElement, ToastContentProps>(
  (props, ref) => {
    return <AriaToastContent {...props} ref={ref} data-tds="toast-content" />;
  }
);

ToastContent.displayName = "Toast.Content";

type ToastIndicatorProps = ComponentPropsWithoutRef<"div"> & {
  variant?: ToastVariant;
};

const STATUS_ICONS = {
  default: AlertCircleIcon,
  accent: AlertCircleIcon,
  success: CheckIcon,
  warning: AlertTriangleIcon,
  danger: AlertCircleIcon
};

// The variant's icon, unless children replace it. Marked when its content
// changes kind, as a promise toast's spinner gives way to its outcome, so
// that change animates and the first paint doesn't
const ToastIndicator = forwardRef<HTMLDivElement, ToastIndicatorProps>(
  ({ children, variant = "default", ...props }, ref) => {
    const childrenKind: unknown = isValidElement(children)
      ? children.type
      : (children ?? "default");
    const previousKindRef = useRef(childrenKind);
    const [hasSwapped, setHasSwapped] = useState(false);

    useLayoutEffect(() => {
      if (previousKindRef.current !== childrenKind) {
        previousKindRef.current = childrenKind;
        setHasSwapped(true);
      }
    }, [childrenKind]);

    const Icon = STATUS_ICONS[variant];

    return (
      <div
        {...props}
        ref={ref}
        data-tds="toast-indicator"
        data-swapped={dataAttr(hasSwapped)}
      >
        {children ?? <Icon aria-hidden />}
      </div>
    );
  }
);

ToastIndicator.displayName = "Toast.Indicator";

type ToastTitleProps = Omit<TextProps, "slot">;

const ToastTitle = forwardRef<HTMLElement, ToastTitleProps>((props, ref) => {
  return <Text {...props} ref={ref} slot="title" data-tds="toast-title" />;
});

ToastTitle.displayName = "Toast.Title";

type ToastDescriptionProps = Omit<TextProps, "slot">;

const ToastDescription = forwardRef<HTMLElement, ToastDescriptionProps>(
  (props, ref) => {
    return (
      <Text
        {...props}
        ref={ref}
        slot="description"
        data-tds="toast-description"
      />
    );
  }
);

ToastDescription.displayName = "Toast.Description";

type ToastCloseButtonProps = CloseButtonProps;

// Closes the toast; shown while the pointer is over it
const ToastCloseButton = forwardRef<HTMLButtonElement, ToastCloseButtonProps>(
  (props, ref) => {
    return (
      <CloseButton {...props} ref={ref} slot="close" data-tds-toast-close="" />
    );
  }
);

ToastCloseButton.displayName = "Toast.CloseButton";

type ToastActionButtonProps = ButtonProps;

const ToastActionButton = forwardRef<HTMLButtonElement, ToastActionButtonProps>(
  (props, ref) => {
    return <Button size="sm" {...props} ref={ref} data-tds-toast-action="" />;
  }
);

ToastActionButton.displayName = "Toast.ActionButton";

type ToastProviderProps<T extends object = ToastContentValue> = Omit<
  AriaToastRegionProps<T>,
  "queue" | "children"
> & {
  /** Renders each toast in place of the default layout */
  children?: AriaToastRegionProps<T>["children"];
  /** The gap between toasts in pixels */
  gap?: number;
  /** Keeps the stack expanded, rather than only while hovered or focused.
   * It doesn't pause the toasts' timers */
  isExpanded?: boolean;
  /** How many toasts show at a time; the rest wait out of sight */
  maxVisibleToasts?: number;
  /** Keys that focus the toasts: modifiers as KeyboardEvent props
   * ("altKey"), others as event.code ("KeyT"). Modifiers left out must be
   * up. [] turns it off */
  hotkey?: string[];
  /** How much each toast behind the front one scales down */
  scaleFactor?: number;
  /** Where on the screen the toasts appear */
  placement?: ToastPlacement;
  /** A queue of its own; by default the shared one `toast` adds to */
  queue?: ToastQueue<T>;
  /** The toasts' width; numbers are pixels */
  width?: number | string;
};

// Renders the queue's toasts as a stack in a notifications landmark. The
// stack opens out while hovered or focused, which holds the toasts' timers;
// Escape closes it, and the hotkey or F6 reaches it
const ToastProviderInner = <T extends object = ToastContentValue>(
  {
    children,
    gap = DEFAULT_GAP,
    hotkey = DEFAULT_HOTKEY,
    isExpanded: isExpandedProp = false,
    maxVisibleToasts,
    placement = "bottom",
    queue: queueProp,
    scaleFactor = DEFAULT_SCALE_FACTOR,
    style,
    width = DEFAULT_TOAST_WIDTH,
    ...rest
  }: ToastProviderProps<T>,
  refProp: ForwardedRef<HTMLDivElement>
): ReactElement => {
  // Toast.css's breakpoint, so the action is placed as it's styled
  const isMobile = useMediaQuery("(width < 768px)");
  const [toastHeights, setToastHeights] = useState<Record<string, number>>({});

  // The latest hotkey, without re-registering the document listener
  const hotkeyRef = useRef(hotkey);
  useEffect(() => {
    hotkeyRef.current = hotkey;
  }, [hotkey]);

  // The region takes the underlying react-stately queue, not the wrapper
  const toastQueue = useMemo(
    (): StatelyToastQueue<T> =>
      queueProp
        ? queueProp.getQueue()
        : (defaultToast.getQueue() as unknown as StatelyToastQueue<T>),
    [queueProp]
  );

  // Toasts mounted but playing their exit animation. Another react-stately
  // queue just removes them at once
  const exitAwareQueue = isExitAwareToastQueue(toastQueue) ? toastQueue : null;
  const exitingKeys = useSyncExternalStore(
    exitAwareQueue ? exitAwareQueue.subscribeExiting : subscribeToNothing,
    exitAwareQueue ? exitAwareQueue.getExitingKeys : getEmptyExitingKeys,
    getEmptyExitingKeys
  );

  const subscribeToQueue = useCallback(
    (onStoreChange: () => void) => toastQueue.subscribe(onStoreChange),
    [toastQueue]
  );
  const visibleToastCount = useSyncExternalStore(
    subscribeToQueue,
    () => toastQueue.visibleToasts.length,
    () => 0
  );

  const [isPointerOrFocusWithin, setIsPointerOrFocusWithin] = useState(false);
  const pointerWithinRef = useRef(false);

  // Expansion listens on the region itself: React Aria gives its children
  // neither the region's hover nor focus within. Touch is ignored, so the
  // stack stays closed on touch screens. Moving between toasts never leaves
  // the region: each toast's ::after covers the gap to its neighbour
  const handleRegionRef = useCallback(
    (node: HTMLDivElement | null) => {
      const forwardRegionRef = (value: HTMLDivElement | null): void => {
        if (typeof refProp === "function") {
          refProp(value);
        } else if (refProp) {
          refProp.current = value;
        }
      };

      forwardRegionRef(node);
      if (!node) return;

      // Focus is checked against document.activeElement: no focusout fires
      // when a focused toast is removed, so a tracked flag would go stale
      const collapseIfOutside = (): void => {
        if (
          !pointerWithinRef.current &&
          !node.contains(document.activeElement)
        ) {
          setIsPointerOrFocusWithin(false);
        }
      };

      const handlePointerEnterOrMove = (event: PointerEvent): void => {
        if (event.pointerType === "touch") return;
        pointerWithinRef.current = true;
        setIsPointerOrFocusWithin(true);
      };

      const handlePointerLeave = (event: PointerEvent): void => {
        if (event.pointerType === "touch") return;
        pointerWithinRef.current = false;
        collapseIfOutside();
      };

      const handleFocusIn = (): void => {
        setIsPointerOrFocusWithin(true);
      };

      const handleFocusOut = (event: FocusEvent): void => {
        if (
          event.relatedTarget instanceof Node &&
          node.contains(event.relatedTarget)
        ) {
          return;
        }
        collapseIfOutside();
      };

      // No browser fires pointerleave or focusout when the hovered or
      // focused toast is removed; the next sign is a pointerover outside, as
      // React Aria's useHover also relies on
      const handleGlobalPointerOver = (event: PointerEvent): void => {
        if (
          event.pointerType === "touch" ||
          node.contains(event.target as Node)
        ) {
          return;
        }
        pointerWithinRef.current = false;
        collapseIfOutside();
      };

      // Escape closes the expanded stack, letting go of focus so the focus
      // check doesn't open it again
      const handleRegionKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== "Escape") return;
        if (node.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
        pointerWithinRef.current = false;
        setIsPointerOrFocusWithin(false);
      };

      // The hotkey focuses the region, a landmark, so F6 reaches it too;
      // focusin then opens the stack
      const handleDocumentKeyDown = (event: KeyboardEvent): void => {
        const keys = hotkeyRef.current;
        if (keys.length === 0) return;

        // Modifiers left out of the hotkey must be up, so Alt+T doesn't
        // also fire on Ctrl+Alt+T
        const hasExpectedModifiers = MODIFIER_PROPS.every(
          (modifier) => event[modifier] === keys.includes(modifier)
        );
        const hasExpectedCodes = keys.every(
          (key) =>
            (MODIFIER_PROPS as readonly string[]).includes(key) ||
            event.code === key
        );
        if (!hasExpectedModifiers || !hasExpectedCodes) return;

        // Claimed, so the browser doesn't act on it too (Alt+letter opens
        // the menu bar on Windows and Linux)
        event.preventDefault();
        node.focus();
      };

      node.addEventListener("pointerenter", handlePointerEnterOrMove);
      // pointermove opens it again when the stack shifts under a resting
      // pointer; Safari and Firefox don't fire boundary events without it
      node.addEventListener("pointermove", handlePointerEnterOrMove);
      node.addEventListener("pointerleave", handlePointerLeave);
      node.addEventListener("focusin", handleFocusIn);
      node.addEventListener("focusout", handleFocusOut);
      node.addEventListener("keydown", handleRegionKeyDown);
      document.addEventListener("pointerover", handleGlobalPointerOver, true);
      document.addEventListener("keydown", handleDocumentKeyDown);

      return () => {
        node.removeEventListener("pointerenter", handlePointerEnterOrMove);
        node.removeEventListener("pointermove", handlePointerEnterOrMove);
        node.removeEventListener("pointerleave", handlePointerLeave);
        node.removeEventListener("focusin", handleFocusIn);
        node.removeEventListener("focusout", handleFocusOut);
        node.removeEventListener("keydown", handleRegionKeyDown);
        document.removeEventListener(
          "pointerover",
          handleGlobalPointerOver,
          true
        );
        document.removeEventListener("keydown", handleDocumentKeyDown);

        // The region unmounts when the queue empties; the next batch starts
        // closed
        pointerWithinRef.current = false;
        setIsPointerOrFocusWithin(false);
        forwardRegionRef(null);
      };
    },
    [refProp]
  );

  // Hovering or focusing the stack holds every timer: React Aria's own hover
  // pause resumes too early when a closing toast vanishes under the
  // pointer. Forced expansion doesn't hold them
  useEffect(() => {
    if (!exitAwareQueue || !isPointerOrFocusWithin) return;
    exitAwareQueue.suspendTimers("interaction");
    return () => {
      exitAwareQueue.resumeTimers("interaction");
    };
  }, [exitAwareQueue, isPointerOrFocusWithin]);

  // Timers hold while the page is hidden, so toasts aren't missed in a
  // background tab
  useEffect(() => {
    if (!exitAwareQueue) return;
    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        exitAwareQueue.suspendTimers("visibility");
      } else {
        exitAwareQueue.resumeTimers("visibility");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      exitAwareQueue.resumeTimers("visibility");
    };
  }, [exitAwareQueue]);

  // One toast never expands; exiting toasts don't count
  const activeToastCount = visibleToastCount - exitingKeys.size;
  const isExpanded =
    (isExpandedProp || isPointerOrFocusWithin) && activeToastCount > 1;

  const resolvedMaxVisibleToasts =
    maxVisibleToasts ??
    queueProp?.maxVisibleToasts ??
    DEFAULT_MAX_VISIBLE_TOAST;

  const handleToastHeightChange = useCallback((key: string, height: number) => {
    setToastHeights((prev) =>
      prev[key] === height ? prev : { ...prev, [key]: height }
    );
  }, []);

  const handleToastHeightRemove = useCallback((key: string) => {
    setToastHeights((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _removed, ...next } = prev;
      return next;
    });
  }, []);

  const defaultChildren = useCallback(
    ({ toast }: { toast: QueuedToast<T> }): ReactNode => {
      const { actionProps, description, indicator, isLoading, title, variant } =
        toast.content as ToastContentValue;
      const action =
        actionProps?.children !== undefined && actionProps.children !== null ? (
          <ToastActionButton {...actionProps} />
        ) : null;

      return (
        <Toast<T>
          placement={placement}
          scaleFactor={scaleFactor}
          toast={toast}
          variant={variant}
        >
          {indicator === null ? null : (
            <ToastIndicator variant={variant}>
              {isLoading ? (
                <Spinner color="current" size="sm" aria-hidden />
              ) : (
                indicator
              )}
            </ToastIndicator>
          )}
          <ToastContent>
            {title !== undefined && title !== null ? (
              <ToastTitle>{title}</ToastTitle>
            ) : null}
            {description !== undefined && description !== null ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
            {isMobile ? action : null}
          </ToastContent>
          {isMobile ? null : action}
          <ToastCloseButton />
        </Toast>
      );
    },
    [isMobile, placement, scaleFactor]
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      exitingKeys,
      gap,
      heightsByKey: toastHeights,
      isExpanded,
      maxVisibleToasts: resolvedMaxVisibleToasts,
      onToastHeightChange: handleToastHeightChange,
      onToastHeightRemove: handleToastHeightRemove,
      placement,
      scaleFactor
    }),
    [
      exitingKeys,
      gap,
      handleToastHeightChange,
      handleToastHeightRemove,
      isExpanded,
      placement,
      resolvedMaxVisibleToasts,
      scaleFactor,
      toastHeights
    ]
  );

  const regionStyle = composeRenderProps(
    style,
    (userStyle) =>
      ({
        "--terria-ds-toast-gap": `${String(gap)}px`,
        "--terria-ds-toast-width":
          typeof width === "number" ? `${String(width)}px` : width,
        ...userStyle
      }) as CSSProperties
  );

  return (
    <AriaToastRegion<T>
      {...rest}
      ref={handleRegionRef}
      queue={toastQueue}
      style={regionStyle}
      data-tds="toast-region"
      data-tds-placement={placement}
      data-expanded={dataAttr(isExpanded)}
    >
      {(renderProps) => (
        <ToastContext.Provider value={contextValue}>
          {children === undefined
            ? defaultChildren(renderProps)
            : typeof children === "function"
              ? children(renderProps)
              : children}
        </ToastContext.Provider>
      )}
    </AriaToastRegion>
  );
};

const ToastProvider = forwardRef(ToastProviderInner) as (<
  T extends object = ToastContentValue
>(
  props: ToastProviderProps<T> & { ref?: ForwardedRef<HTMLDivElement> }
) => ReactElement) & { displayName?: string };

ToastProvider.displayName = "Toast.Provider";

export {
  Toast,
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastTitle
};
export type {
  ToastActionButtonProps,
  ToastCloseButtonProps,
  ToastContentProps,
  ToastDescriptionProps,
  ToastIndicatorProps,
  ToastPlacement,
  ToastProps,
  ToastProviderProps,
  ToastTitleProps,
  ToastVariant
};
