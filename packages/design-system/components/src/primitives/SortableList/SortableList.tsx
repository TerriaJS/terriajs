import { GripVerticalIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { ButtonContext } from "react-aria-components/Button";
import {
  Button as AriaButton,
  GridList as AriaGridList,
  GridListItem as AriaGridListItem,
  type ButtonProps as AriaButtonProps,
  type DroppableCollectionReorderEvent,
  type GridListProps as AriaGridListProps,
  type Key
} from "react-aria-components/GridList";
import {
  DropIndicator as AriaDropIndicator,
  useDragAndDrop
} from "react-aria-components/useDragAndDrop";
import { moveItems, type ItemDropTarget } from "./moveItems";
import "./SortableList.css";

type SortableListDropIndicator = "line" | "item";

// Only up and down for now, as the list is a column
type SortableListAxis = "y";

type SortableListDragFrom = "item" | "handle";

type SortableItemState = {
  /** This item is being dragged */
  isDragging: boolean;
};

type SortableListProps<T extends { id: Key }> = Omit<
  AriaGridListProps<T>,
  "children" | "items" | "dragAndDropHooks"
> & {
  items: Iterable<T>;
  /** The item's text, for screen readers and typing to find it */
  getItemText: (item: T) => string;
  /** Draws an item: your markup, given its drag state */
  children: (item: T, state: SortableItemState) => ReactNode;
  /** Called with the moved keys and where they were dropped */
  onReorder: (event: DroppableCollectionReorderEvent) => void;
  /** Where an item would land: a line, or the dragged item itself, moved
   * there while dragging */
  dropIndicator?: SortableListDropIndicator;
  /** Draws what follows the pointer; unless set, a copy of the dragged row
   * as it looked when picked up */
  renderDragPreview?: (items: T[]) => ReactNode;
  /** Keeps what follows the pointer in the list's column (y). The
   * browser's drag picture can go anywhere, so the list draws its own */
  axis?: SortableListAxis;
  /** Where a pointer drag can start: anywhere on the item, or only on its
   * SortableList.DragHandle. From the keyboard it's always the handle */
  dragFrom?: SortableListDragFrom;
  /** How long, in milliseconds, a pointer must be held before moving it
   * starts a drag. Moved sooner, it does what it would without a drag, such
   * as selecting text. Touch already holds before dragging */
  dragDelay?: number;
  /** How deep, in pixels, the zone at the top and bottom of what scrolls
   * the list is, where a pointer drag scrolls it */
  scrollEdge?: number;
  /** How fast, in pixels a second, a pointer drag scrolls at the edge of
   * that zone and past it; slower further in */
  scrollSpeed?: number;
};

// What a dragged item carries. Reordering needs only that it came from the
// list itself
const DRAG_TYPE = "application/x-terria-sortable-item";

type Point = { x: number; y: number };

// While the pointer is over the page, browsers report it at least every
// 350ms (±200ms, as the HTML spec has it); Chrome does every 50ms or so.
// Unheard of for longer, it has left the page, and the list stops scrolling
const POINTER_GONE_AFTER = 600;

// The element that scrolls the list: itself, the nearest one around it, or
// else the page
const scrollParent = (element: Element | null): Element | null => {
  for (
    let at = element;
    at && at !== document.documentElement;
    at = at.parentElement
  ) {
    if (
      /auto|scroll/.test(getComputedStyle(at).overflowY) &&
      at.scrollHeight > at.clientHeight
    ) {
      return at;
    }
  }
  return document.scrollingElement;
};

// Where the scrolling element shows its content: the page shows it in the
// window
const scrollArea = (scroller: Element): { top: number; bottom: number } =>
  scroller === document.scrollingElement
    ? { top: 0, bottom: window.innerHeight }
    : scroller.getBoundingClientRect();

// Where a pointer drag with an axis started: the dragged row and the pointer
type AxisDrag = { rect: DOMRect; start: Point };

// The item's drag button props, which React Aria hands down through
// ButtonContext. Components with buttons of their own, such as a Disclosure,
// replace that context, so the item's is kept here for the handle
const ItemButtonsContext =
  createContext<React.ContextType<typeof ButtonContext>>(null);

// Keeps the item's ButtonContext for a handle anywhere inside it
const KeepItemButtons = ({
  children
}: {
  children: ReactNode;
}): React.ReactElement => (
  <ItemButtonsContext.Provider value={useContext(ButtonContext)}>
    {children}
  </ItemButtonsContext.Provider>
);

type TargetReporterProps = {
  target: ItemDropTarget;
  onTarget: (target: ItemDropTarget) => void;
};

// Tells the list where the dragged item would land. React Aria only says so
// while drawing the drop indicator, and the list can't change during that.
// Only a new place is told, not each time the indicator is drawn
const TargetReporter = ({ target, onTarget }: TargetReporterProps): null => {
  const { key, dropPosition } = target;
  useEffect(() => {
    onTarget({ type: "item", key, dropPosition });
  }, [key, dropPosition, onTarget]);
  return null;
};

// A list people reorder by dragging an item's handle, or from the keyboard:
// Enter on the handle picks the item up, the arrows move it, Enter drops it.
// The items are your markup, given their drag state
const SortableList = <T extends { id: Key }>({
  items,
  getItemText,
  children,
  onReorder,
  dropIndicator = "line",
  renderDragPreview,
  axis,
  dragFrom = "item",
  dragDelay = 0,
  scrollEdge = 48,
  scrollSpeed = 1200,
  // Items hold controls, such as sliders, that use the arrow keys
  // themselves, so Tab moves between an item's controls and the arrows are
  // theirs
  keyboardNavigationBehavior = "tab",
  ...props
}: SortableListProps<T>): React.ReactElement => {
  const listRef = useRef<HTMLDivElement>(null);
  const [draggedKeys, setDraggedKeys] = useState<Set<Key>>(() => new Set());
  // With the item indicator, where the dragged item has been moved to
  const [movedTo, setMovedTo] = useState<ItemDropTarget | null>(null);

  // Read once for each iterable given, as one such as a generator can only
  // be read once, and the list draws again as a drag goes
  const list = useMemo(() => [...items], [items]);
  const byKey = new Map(list.map((item) => [item.id, item]));
  const itemsOf = (keys: Iterable<Key>): T[] =>
    [...keys].flatMap((key) => {
      const item = byKey.get(key);
      return item ? [item] : [];
    });
  const draggedItems = itemsOf(draggedKeys);

  // What a drag started with. The browser takes its picture as the drag
  // starts, before the list draws again, so the picture reads it from here
  const dragStartRef = useRef<{
    keys: Set<Key>;
    width: number;
    rows: Element[];
  } | null>(null);

  // Fills what follows the pointer with copies of the dragged rows as they
  // looked as the drag started. Copied from the page, not drawn again by
  // children, so they keep what your markup holds itself, such as a ticked
  // box or typed text
  const showDraggedRows = (node: HTMLElement | null): void => {
    node?.replaceChildren(
      ...(dragStartRef.current?.rows ?? []).map((row) => row.cloneNode(true))
    );
  };

  const [axisDrag, setAxisDrag] = useState<AxisDrag | null>(null);
  const [pointer, setPointer] = useState<Point | null>(null);

  const isDragging = draggedKeys.size > 0;

  // Follows a pointer drag; one from the keyboard doesn't move over the page.
  // The browser scrolls only right at the container's edge, and only while
  // the pointer is in it, so the list scrolls itself: while the pointer is in
  // the scroll zone at the top or bottom, or past it, faster the further in
  useEffect(() => {
    const scroller = isDragging ? scrollParent(listRef.current) : null;
    let last: Point | null = null;
    let lastAt = 0;
    let frame = 0;
    let lastFrame = 0;
    // Slow, a frame may move less than a pixel, which a browser may round
    // away; it's kept until it adds up to whole pixels
    let unscrolled = 0;

    const onDragOver = (event: DragEvent): void => {
      last = { x: event.clientX, y: event.clientY };
      lastAt = performance.now();
      // Only the axis copy follows the pointer; otherwise the list would draw
      // every item again each time it moves
      if (axis) setPointer(last);
    };
    const scroll = (now: number): void => {
      // The time since the last frame, so the speed is the same however
      // often the screen draws; a long pause counts as one frame
      const seconds = lastFrame ? Math.min(now - lastFrame, 100) / 1000 : 0;
      lastFrame = now;
      if (scroller && last && performance.now() - lastAt < POINTER_GONE_AFTER) {
        const { top, bottom } = scrollArea(scroller);
        // Each zone is at most half the area, so they never overlap
        const zone = Math.min(scrollEdge, (bottom - top) / 2);
        // How far into the zone, up (negative) or down; at the edge and past
        // it, as far as the zone is deep
        const into =
          last.y < top + zone
            ? last.y - (top + zone)
            : last.y > bottom - zone
              ? last.y - (bottom - zone)
              : 0;
        unscrolled +=
          Math.sign(into) *
          Math.min(Math.abs(into) / Math.max(zone, 1), 1) *
          scrollSpeed *
          seconds;
        const pixels = Math.trunc(unscrolled);
        scroller.scrollTop += pixels;
        unscrolled -= pixels;
      }
      frame = requestAnimationFrame(scroll);
    };

    if (!isDragging) return;
    // Captured, as the list stops it over its rows
    document.addEventListener("dragover", onDragOver, true);
    frame = requestAnimationFrame(scroll);
    return () => {
      document.removeEventListener("dragover", onDragOver, true);
      cancelAnimationFrame(frame);
    };
  }, [isDragging, axis, scrollEdge, scrollSpeed]);

  // React Aria makes the whole row draggable, and the browser starts a drag
  // as soon as the pointer moves. A drag pressed off the handle with
  // dragFrom handle, or moved before dragDelay, is refused before it reaches
  // the row
  useEffect(() => {
    const list = listRef.current;
    if ((dragFrom !== "handle" && dragDelay <= 0) || !list) return;
    let onHandle = false;
    let pressedAt = 0;
    const onPointerDown = (event: PointerEvent): void => {
      onHandle =
        event.target instanceof Element &&
        event.target.closest('[data-tds="sortable-list-drag-handle"]') !== null;
      pressedAt = performance.now();
    };
    const onDragStart = (event: DragEvent): void => {
      const offHandle = dragFrom === "handle" && !onHandle;
      const tooSoon = performance.now() - pressedAt < dragDelay;
      if (!offHandle && !tooSoon) return;
      event.preventDefault();
      event.stopPropagation();
    };
    list.addEventListener("pointerdown", onPointerDown, true);
    list.addEventListener("dragstart", onDragStart, true);
    return () => {
      list.removeEventListener("pointerdown", onPointerDown, true);
      list.removeEventListener("dragstart", onDragStart, true);
    };
  }, [dragFrom, dragDelay]);

  const { dragAndDropHooks } = useDragAndDrop<T>({
    // A type only this list uses: as text, a drop on a text field or another
    // app would paste the item's text there
    getItems: (keys) => [...keys].map((key) => ({ [DRAG_TYPE]: String(key) })),
    onReorder: (event) => {
      // With the item indicator, the item has been moved where it lands
      // already, and React Aria's target is often next to it. Dropped before
      // it could move, React Aria's target is where it lands
      const target =
        dropIndicator === "item" ? (movedTo ?? event.target) : event.target;
      // Dropped next to itself, it's where it was. Several items dropped next
      // to one of them stay where they are too, rather than gathering there
      if (event.keys.has(target.key)) return;
      onReorder({ ...event, target });
    },
    onDragStart: (event) => {
      setDraggedKeys(event.keys);
      const [key] = event.keys;
      const row =
        key === undefined
          ? null
          : listRef.current?.querySelector(
              `[data-key="${CSS.escape(String(key))}"]`
            );
      dragStartRef.current = {
        keys: event.keys,
        width: row?.getBoundingClientRect().width ?? 0,
        // Still as they are at rest: the list draws them dragged after this
        rows: [...event.keys].flatMap((dragged) => {
          const cell = listRef.current?.querySelector(
            `[data-key="${CSS.escape(String(dragged))}"] > [role="gridcell"]`
          );
          if (!cell) return [];
          const copy = document.createElement("div");
          copy.append(
            ...[...cell.childNodes].map((node) => node.cloneNode(true))
          );
          // Ids belong to the rows themselves
          for (const element of copy.querySelectorAll("[id]")) {
            element.removeAttribute("id");
          }
          return [copy];
        })
      };
      if (axis && row) {
        setAxisDrag({
          rect: row.getBoundingClientRect(),
          start: { x: event.x, y: event.y }
        });
      }
    },
    onDragEnd: () => {
      setDraggedKeys(new Set());
      setMovedTo(null);
      setAxisDrag(null);
      setPointer(null);
    },
    renderDragPreview: () => {
      // With an axis the browser's picture is left empty; the list draws
      // its own
      if (axis) return <div data-tds="sortable-list-empty-preview" />;
      const dragged = itemsOf(dragStartRef.current?.keys ?? []);
      if (renderDragPreview) return <>{renderDragPreview(dragged)}</>;
      // Unless set, copies of the dragged rows as wide as they are: left to
      // itself the browser pictures a row as it's drawn while dragged
      return (
        <div
          ref={showDraggedRows}
          data-tds="sortable-list-drag-preview"
          style={{ inlineSize: dragStartRef.current?.width }}
        />
      );
    },
    renderDropIndicator: (target) => (
      <AriaDropIndicator
        target={target}
        // It passes on no data attributes, so the list styles it by class
        className="tds-sortable-list-drop-indicator"
      >
        {({ isDropTarget }) => {
          if (!isDropTarget || target.type !== "item") return null;
          // Next to the dragged item, it has landed already
          if (dropIndicator === "item" && !draggedKeys.has(target.key)) {
            return <TargetReporter target={target} onTarget={setMovedTo} />;
          }
          return null;
        }}
      </AriaDropIndicator>
    )
  });

  // What follows the pointer along the axis
  const axisCopy = axisDrag && pointer && (
    <div
      // Your preview, or copies of the dragged rows
      ref={renderDragPreview ? undefined : showDraggedRows}
      aria-hidden
      data-tds="sortable-list-drag-overlay"
      // Physical, as the viewport coordinates it's placed by are
      style={{
        top: axisDrag.rect.top + pointer.y - axisDrag.start.y,
        left: axisDrag.rect.left,
        width: axisDrag.rect.width
      }}
    >
      {renderDragPreview?.(draggedItems)}
    </div>
  );

  return (
    <>
      <AriaGridList
        {...props}
        ref={listRef}
        keyboardNavigationBehavior={keyboardNavigationBehavior}
        items={movedTo ? moveItems(list, draggedKeys, movedTo) : list}
        dragAndDropHooks={dragAndDropHooks}
        data-tds="sortable-list"
        data-tds-drop-indicator={dropIndicator}
      >
        {(item) => (
          <AriaGridListItem
            id={item.id}
            textValue={getItemText(item)}
            data-tds="sortable-list-item"
          >
            {({ isDragging }) => (
              <KeepItemButtons>
                {children(item, { isDragging: isDragging ?? false })}
              </KeepItemButtons>
            )}
          </AriaGridListItem>
        )}
      </AriaGridList>
      {axisCopy && createPortal(axisCopy, document.body)}
    </>
  );
};

SortableList.displayName = "SortableList";

type SortableListDragHandleProps = Omit<
  AriaButtonProps,
  "slot" | "children" | "className" | "style"
> & {
  /** Replaces the grip icon */
  children?: ReactNode;
  className?: string;
};

// Picks its item up. What it shows takes the pointer, so it can show a grab
// cursor and start a drag: React Aria's drag button ignores the pointer, as
// Firefox starts no drag from a button. The button lies over it for the
// keyboard, named "Drag" and the item's text
const SortableListDragHandle = forwardRef<
  HTMLButtonElement,
  SortableListDragHandleProps
>(({ children, className, ...props }, ref) => {
  const itemButtons = useContext(ItemButtonsContext);

  return (
    // A div, as it may hold blocks, such as a whole header
    <div className={className} data-tds="sortable-list-drag-handle">
      <ButtonContext.Provider value={itemButtons}>
        <AriaButton
          {...props}
          ref={ref}
          slot="drag"
          data-tds="sortable-list-drag-button"
        />
      </ButtonContext.Provider>
      {children ?? <GripVerticalIcon aria-hidden />}
    </div>
  );
});

SortableListDragHandle.displayName = "SortableList.DragHandle";

export { SortableList, SortableListDragHandle };
export type {
  SortableItemState,
  SortableListAxis,
  SortableListDragFrom,
  SortableListDragHandleProps,
  SortableListDropIndicator,
  SortableListProps
};
