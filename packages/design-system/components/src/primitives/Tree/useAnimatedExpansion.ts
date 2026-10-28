import { useLayoutEffect } from "@react-aria/utils";
import { useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import type { Key } from "react-aria-components";
import { useControlledState } from "react-stately/useControlledState";

const DURATION = 200;
const EASING = "ease-out";

// The rows a group's expansion shows. Rows are flat siblings, so they're the
// ones after it at a deeper level
const descendantRows = (tree: HTMLElement, key: Key): HTMLElement[] => {
  const row = tree.querySelector(
    `[role="row"][data-key="${CSS.escape(String(key))}"]`
  );
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

  const change = (next: Set<Key>): void => {
    for (const animation of closingRef.current) animation.cancel();
    closingRef.current = [];
    setCollapsingKeys(NONE);

    const tree = treeRef.current;
    if (
      !tree ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setKeys(next);
      return;
    }

    openingRef.current = [...next].filter((key) => !keys.has(key));
    const closed = [...keys].filter((key) => !next.has(key));
    const rows = closed.flatMap((key) => descendantRows(tree, key));
    if (rows.length === 0) {
      setKeys(next);
      return;
    }

    const animations = animateRows(rows, "close");
    closingRef.current = animations;
    setCollapsingKeys(new Set(closed));
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        closingRef.current = [];
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

  useLayoutEffect(() => {
    const tree = treeRef.current;
    const opened = openingRef.current;
    openingRef.current = [];
    if (!tree) return;
    animateRows(
      opened.flatMap((key) => descendantRows(tree, key)),
      "open"
    );
  }, [keys, treeRef]);

  return { expandedKeys: keys, setExpandedKeys: change, collapsingKeys };
};

export { useAnimatedExpansion };
