import { useLayoutEffect } from "@react-aria/utils";
import { useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import type { Key } from "react-aria-components";
import { useControlledState } from "react-stately/useControlledState";

const DURATION = 200;
// --terria-ds-ease-out
const EASING = "cubic-bezier(0, 0, 0.2, 1)";

// A group's own row
const rowFor = (tree: HTMLElement, key: Key): HTMLElement | null =>
  tree.querySelector(`[role="row"][data-key="${CSS.escape(String(key))}"]`);

// The rows a group's expansion shows. Rows are flat siblings, so they're the
// ones after it at a deeper level
const descendantRows = (tree: HTMLElement, key: Key): HTMLElement[] => {
  const row = rowFor(tree, key);
  const level = Number(row?.getAttribute("aria-level"));
  const rows: HTMLElement[] = [];
  for (
    let next = row?.nextElementSibling;
    next instanceof HTMLElement &&
    Number(next.getAttribute("aria-level")) > level;
    next = next.nextElementSibling
  ) {
    rows.push(next);
  }
  return rows;
};

// Grows rows from nothing, or shrinks them to nothing, taking the gap above
// each with them so the rows below move smoothly
const animateRows = (
  rows: HTMLElement[],
  direction: "open" | "close"
): Animation[] =>
  rows.map((row) => {
    const height = `${String(row.offsetHeight)}px`;
    const gap = row.parentElement
      ? getComputedStyle(row.parentElement).rowGap
      : "0px";
    const shown = {
      blockSize: height,
      minBlockSize: height,
      marginBlockStart: "0px",
      opacity: 1
    };
    const hidden = {
      blockSize: "0px",
      minBlockSize: "0px",
      marginBlockStart: `calc(${gap} * -1)`,
      opacity: 0
    };
    row.style.overflow = "clip";
    const animation = row.animate(
      direction === "open" ? [hidden, shown] : [shown, hidden],
      {
        duration: DURATION,
        easing: EASING,
        // Closing rows stay hidden until React removes them
        fill: direction === "close" ? "forwards" : "none"
      }
    );
    const reset = (): void => {
      row.style.overflow = "";
    };
    animation.finished.then(reset, reset);
    return animation;
  });

// A virtualized tree places each row itself, in a wrapper of its own, so rows
// don't move each other: they're slid from where they were instead
const isVirtualized = (tree: HTMLElement): boolean => {
  const wrapper = tree.querySelector('[role="row"]')?.parentElement;
  return !!wrapper && getComputedStyle(wrapper).position === "absolute";
};

// Where each shown row is, by key, from the top of the tree's content
const rowTops = (tree: HTMLElement): Map<string, number> => {
  const origin = tree.getBoundingClientRect().top - tree.scrollTop;
  return new Map(
    [...tree.querySelectorAll<HTMLElement>('[role="row"][data-key]')].map(
      (row) => [
        row.getAttribute("data-key") ?? "",
        row.getBoundingClientRect().top - origin
      ]
    )
  );
};

type VirtualChange = {
  // Where the rows were before it
  before: Map<string, number>;
  // The bottom of each group it opens
  openedBottoms: number[];
  isOpening: boolean;
};

const slide = (row: HTMLElement, from: number): Animation =>
  row.animate([{ translate: `0 ${String(from)}px` }, { translate: "0 0" }], {
    duration: DURATION,
    easing: EASING
  });

// Grows a row out of its group, from nothing, as the rows above it grow
const reveal = (row: HTMLElement, below: number): Animation =>
  row.animate(
    [
      {
        translate: `0 ${String(-below)}px`,
        clipPath: "inset(0 0 100% 0)",
        opacity: 0
      },
      { translate: "0 0", clipPath: "inset(0)", opacity: 1 }
    ],
    { duration: DURATION, easing: EASING }
  );

// Slides a virtualized tree's rows from where they were to where they are.
// Rows new below an opening group grow out of it; rows new below a closing
// one come up from the bottom of the view, as the rows below them do
const animateVirtualRows = (
  tree: HTMLElement,
  { before, openedBottoms, isOpening }: VirtualChange
): Animation[] => {
  const after = rowTops(tree);
  const rows = new Map(
    [...tree.querySelectorAll<HTMLElement>('[role="row"][data-key]')].map(
      (row) => [row.getAttribute("data-key") ?? "", row]
    )
  );
  const shifts = [...after]
    .map(([key, top]) => (before.get(key) ?? top) - top)
    .filter((shift) => shift !== 0);
  const viewBottom = tree.scrollTop + tree.clientHeight;
  return [...after].flatMap(([key, top]) => {
    const row = rows.get(key);
    const was = before.get(key);
    if (!row) return [];
    if (was !== undefined) return was === top ? [] : [slide(row, was - top)];
    if (isOpening) {
      const groupBottom = Math.max(
        ...openedBottoms.filter((bottom) => bottom <= top)
      );
      return Number.isFinite(groupBottom)
        ? [reveal(row, top - groupBottom)]
        : [];
    }
    return [slide(row, shifts[0] ?? Math.max(0, viewBottom - top))];
  });
};

type ExpansionOptions = {
  expandedKeys?: Iterable<Key>;
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
};

type AnimatedExpansion = {
  expandedKeys: Set<Key>;
  setExpandedKeys: (keys: Set<Key>) => void;
  // Groups whose rows are animating shut, so already shown as collapsed
  collapsingKeys: ReadonlySet<Key>;
};

const NONE: ReadonlySet<Key> = new Set();

const sameKeys = (a: ReadonlySet<Key>, b: ReadonlySet<Key>): boolean =>
  a.size === b.size && [...a].every((key) => b.has(key));

// The tree's expanded keys, controlled or not. A collapsing group's rows
// animate shut before it collapses, as react-aria removes them at once; an
// expanding group's rows animate open once they're rendered
const useAnimatedExpansion = (
  treeRef: RefObject<HTMLElement | null>,
  { expandedKeys, defaultExpandedKeys, onExpandedChange }: ExpansionOptions
): AnimatedExpansion => {
  const [keys, setKeys] = useControlledState<Set<Key>>(
    expandedKeys === undefined ? undefined : new Set(expandedKeys),
    new Set(defaultExpandedKeys ?? []),
    onExpandedChange
  );
  const [collapsingKeys, setCollapsingKeys] = useState(NONE);
  const openingRef = useRef<Key[]>([]);
  const closingRef = useRef<Animation[]>([]);
  // Rows given aria-expanded="false" while their group collapses
  const announcedRef = useRef<ReadonlySet<Key>>(NONE);
  // The keys a collapse in progress ends on
  const pendingRef = useRef<Set<Key> | null>(null);
  // And the keys it started from
  const fromRef = useRef<Set<Key>>(keys);
  const virtualRef = useRef<VirtualChange | null>(null);
  const slidingRef = useRef<Animation[]>([]);

  const cancelCollapse = (): void => {
    for (const animation of closingRef.current) animation.cancel();
    closingRef.current = [];
    pendingRef.current = null;
    setCollapsingKeys(NONE);
  };

  const change = (next: Set<Key>): void => {
    cancelCollapse();

    const tree = treeRef.current;
    if (
      !tree ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setKeys(next);
      return;
    }

    const opened = [...next].filter((key) => !keys.has(key));
    const closed = [...keys].filter((key) => !next.has(key));

    if (isVirtualized(tree)) {
      for (const animation of slidingRef.current) animation.cancel();
      const before = rowTops(tree);
      virtualRef.current = {
        before,
        openedBottoms: opened.flatMap((key) => {
          const row = rowFor(tree, key);
          const top = before.get(String(key));
          return row && top !== undefined ? [top + row.offsetHeight] : [];
        }),
        isOpening: opened.length > 0
      };
      setKeys(next);
      return;
    }

    openingRef.current = opened;
    const rows = closed.flatMap((key) => descendantRows(tree, key));
    if (rows.length === 0) {
      setKeys(next);
      return;
    }

    const animations = animateRows(rows, "close");
    closingRef.current = animations;
    pendingRef.current = next;
    fromRef.current = keys;
    setCollapsingKeys(new Set(closed));
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        closingRef.current = [];
        pendingRef.current = null;
        // Rendered at once, so the rows are gone before their animations
        // end: left to React's schedule, a busy page can draw a frame first,
        // showing them again at full size
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- One render, when a collapse ends; see above
        flushSync(() => {
          setCollapsingKeys(NONE);
          setKeys(next);
        });
        // Rows a controlled tree kept, rather than removed, show again
        for (const animation of animations) animation.cancel();
      },
      // Cancelled by a newer change, which applies instead
      () => undefined
    );
  };

  // A collapsing group reads as collapsed, but stays expanded to react-aria
  // until its rows have gone, so react-aria would take a key or a press on
  // the tree meanwhile for one on an expanded group: the chevron or the right
  // arrow would collapse it again, not open it. The collapse ends at once
  // instead, before react-aria handles the event
  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;
    const finishCollapse = (): void => {
      const next = pendingRef.current;
      if (!next) return;
      pendingRef.current = null;
      for (const animation of closingRef.current) animation.cancel();
      closingRef.current = [];
      // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- react-aria reads the expanded keys as it handles this same event
      flushSync(() => {
        setCollapsingKeys(NONE);
        setKeys(next);
      });
    };
    tree.addEventListener("keydown", finishCollapse, true);
    tree.addEventListener("pointerdown", finishCollapse, true);
    return () => {
      tree.removeEventListener("keydown", finishCollapse, true);
      tree.removeEventListener("pointerdown", finishCollapse, true);
    };
  }, [setKeys, treeRef]);

  // A controlled tree given other keys while a group collapses: the keys the
  // collapse ends on are older than them, and would undo them
  useLayoutEffect(() => {
    if (!pendingRef.current || sameKeys(keys, fromRef.current)) return;
    cancelCollapse();
  }, [keys]);

  useLayoutEffect(() => {
    const tree = treeRef.current;
    const opened = openingRef.current;
    const virtual = virtualRef.current;
    openingRef.current = [];
    virtualRef.current = null;
    if (!tree) return;
    if (virtual) {
      slidingRef.current = animateVirtualRows(tree, virtual);
      return;
    }
    animateRows(
      opened.flatMap((key) => descendantRows(tree, key)),
      "open"
    );
  }, [keys, treeRef]);

  // A collapsing group stays expanded to react-aria until its rows have
  // animated away, so its row tells screen readers it's collapsed meanwhile:
  // they hear the change when it's asked for, not when the animation ends.
  // react-aria's own aria-expanded, unchanged until then, isn't rewritten
  // over it; a group opened again before its rows are gone is put back
  useLayoutEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;
    for (const key of announcedRef.current) {
      if (!collapsingKeys.has(key) && keys.has(key)) {
        rowFor(tree, key)?.setAttribute("aria-expanded", "true");
      }
    }
    for (const key of collapsingKeys) {
      rowFor(tree, key)?.setAttribute("aria-expanded", "false");
    }
    announcedRef.current = collapsingKeys;
  }, [collapsingKeys, keys, treeRef]);

  return { expandedKeys: keys, setExpandedKeys: change, collapsingKeys };
};

export { useAnimatedExpansion };
