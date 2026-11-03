import { useCallback, useContext, useRef, type PointerEvent } from "react";
import { OverlayTriggerStateContext } from "react-aria-components/Dialog";

type DrawerPlacement = "top" | "bottom" | "left" | "right";

// Before a press counts as a drag, in px
const DRAG_THRESHOLD = 8;
// Dragged past this share of its size, it closes
const DISMISS_FRACTION = 0.3;
// Or flicked faster than this, in px/ms
const VELOCITY_THRESHOLD = 0.5;

// Only the drawer's own handle, header and footer start a drag: not its
// controls, nor its body, which scrolls, nor a nested drawer's dialog
const startsDrag = (target: HTMLElement, dialog: HTMLElement): boolean =>
  target.closest('[data-tds="drawer-dialog"]') === dialog &&
  !target.closest(
    "input, textarea, button, [role='button'], select, a, [data-tds='drawer-body']"
  );

type DrawerDrag = {
  // React 18's RefObject<T> already allows null; adding it again won't fit
  // an element's ref there
  dialogRef: { readonly current: HTMLDivElement | null };
  dragHandlers: {
    onPointerDown?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
  };
};

/**
 * Drag to dismiss: the dialog follows the pointer towards the edge it came
 * from, and closes when dragged past a third of its size or flicked; short
 * of that it springs back. It moves through an inline transform, so the
 * closing slide carries on from where it was let go
 */
export const useDrawerDrag = (
  placement: DrawerPlacement | undefined,
  isDismissable: boolean
): DrawerDrag => {
  const overlayState = useContext(OverlayTriggerStateContext);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isActiveRef = useRef(false);
  const startPosRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastPosRef = useRef(0);

  const isVertical = placement === "top" || placement === "bottom";

  const getPos = useCallback(
    (event: PointerEvent) => (isVertical ? event.clientY : event.clientX),
    [isVertical]
  );

  // Only towards the edge it came from
  const clamp = useCallback(
    (delta: number) => {
      switch (placement) {
        case "bottom":
        case "right":
          return Math.max(0, delta);
        case "top":
        case "left":
          return Math.min(0, delta);
        default:
          return delta;
      }
    },
    [placement]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (
        !startsDrag(
          event.target as HTMLElement,
          event.currentTarget as HTMLElement
        )
      ) {
        return;
      }

      isDraggingRef.current = true;
      isActiveRef.current = false;
      startPosRef.current = getPos(event);
      lastPosRef.current = startPosRef.current;
      lastTimeRef.current = Date.now();
      currentOffsetRef.current = 0;
      velocityRef.current = 0;
    },
    [getPos]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const dialog = dialogRef.current;
      if (!isDraggingRef.current || !dialog) return;

      const pos = getPos(event);
      const rawDelta = pos - startPosRef.current;
      const delta = clamp(rawDelta);

      // Only past the threshold, so a press isn't taken for a drag
      if (!isActiveRef.current) {
        if (Math.abs(rawDelta) < DRAG_THRESHOLD) return;
        isActiveRef.current = true;
        dialog.style.transition = "none";
        try {
          dialog.setPointerCapture(event.pointerId);
        } catch {
          // The pointer may already be gone; the drag carries on without it
        }
      }

      currentOffsetRef.current = delta;

      // For telling a flick
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed > 0) {
        velocityRef.current = (pos - lastPosRef.current) / elapsed;
        lastTimeRef.current = now;
        lastPosRef.current = pos;
      }

      dialog.style.transform = `translate${isVertical ? "Y" : "X"}(${String(delta)}px)`;
    },
    [getPos, clamp, isVertical]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const dialog = dialogRef.current;

      if (!dialog || !isActiveRef.current) {
        isActiveRef.current = false;
        return;
      }
      isActiveRef.current = false;

      try {
        dialog.releasePointerCapture(event.pointerId);
      } catch {
        // Already released
      }

      // A cancelled pointer, such as a touch the browser took over, springs
      // back; only a flick towards the edge counts, not one back the other way
      const size = isVertical ? dialog.offsetHeight : dialog.offsetWidth;
      const shouldDismiss =
        event.type !== "pointercancel" &&
        (Math.abs(currentOffsetRef.current) > size * DISMISS_FRACTION ||
          Math.abs(clamp(velocityRef.current)) > VELOCITY_THRESHOLD);

      if (shouldDismiss && overlayState) {
        // The transform stays, so the closing slide starts where it was let go
        overlayState.close();
      } else {
        dialog.style.transition =
          "transform var(--terria-ds-duration-300) var(--terria-ds-ease-out-fluid)";
        dialog.style.transform = "";
        dialog.addEventListener(
          "transitionend",
          () => {
            dialog.style.transition = "";
          },
          { once: true }
        );
      }

      currentOffsetRef.current = 0;
      velocityRef.current = 0;
    },
    [clamp, isVertical, overlayState]
  );

  return {
    dialogRef,
    dragHandlers: isDismissable
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp
        }
      : {}
  };
};

export type { DrawerPlacement };
