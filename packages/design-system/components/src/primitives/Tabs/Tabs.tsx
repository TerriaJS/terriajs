import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon
} from "@terria/design-system-icons";
import {
  Children,
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import { composeRenderProps } from "react-aria-components/composeRenderProps";
import {
  SelectionIndicator,
  type SelectionIndicatorProps
} from "react-aria-components/SelectionIndicator";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps
} from "react-aria-components/Tabs";
import "./Tabs.css";

export type TabsVariant = "primary" | "secondary";

// Tabs.List lays out its scroll arrows by the root's orientation
const VerticalContext = createContext(false);

export type TabsProps = AriaTabsProps & {
  /** primary: tabs in a pill; secondary: tabs on an underline */
  variant?: TabsVariant;
  /** Stretches the tab list to its container, sharing the width equally */
  fullWidth?: boolean;
};

// Holds a Tabs.List and a Tabs.Panel for each tab
export const TabsRoot = ({
  variant = "primary",
  fullWidth = false,
  orientation = "horizontal",
  keyboardActivation = "automatic",
  ...props
}: TabsProps): React.ReactElement => {
  return (
    <VerticalContext.Provider value={orientation === "vertical"}>
      <AriaTabs
        {...props}
        orientation={orientation}
        keyboardActivation={keyboardActivation}
        data-tds="tabs"
        data-tds-keyboard-activation={keyboardActivation}
        data-tds-variant={variant}
        data-tds-full-width={fullWidth || undefined}
      />
    </VerticalContext.Provider>
  );
};

TabsRoot.displayName = "Tabs";

export type TabsListProps<T extends object = object> = AriaTabListProps<T>;

// Whether there's more to scroll to before and after what's in view
const useScrollEdges = (
  ref: RefObject<HTMLDivElement | null>,
  vertical: boolean
): { start: boolean; end: boolean } => {
  const [edges, setEdges] = useState({ start: false, end: false });

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;

    const update = (): void => {
      // Right-to-left scroll positions run from 0 at the start to negative
      const position = vertical ? list.scrollTop : Math.abs(list.scrollLeft);
      const max = vertical
        ? list.scrollHeight - list.clientHeight
        : list.scrollWidth - list.clientWidth;
      const start = position > 1;
      const end = position < max - 1;
      setEdges((current) =>
        current.start === start && current.end === end
          ? current
          : { start, end }
      );
    };

    update();
    list.addEventListener("scroll", update, { passive: true });
    // ponytail: observes the tabs there at mount; tabs added later are seen
    // on the next scroll or resize
    const observer = new ResizeObserver(update);
    observer.observe(list);
    for (const tab of list.children) observer.observe(tab);

    return () => {
      list.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref, vertical]);

  return edges;
};

// The pill, or the underline, holding the tabs. When they don't fit, the
// list scrolls, its ends fade, and arrows scroll it a page at a time. The
// arrows sit beside the list, not in it: a tablist holds only tabs
export const TabsList = <T extends object>(
  props: TabsListProps<T>
): React.ReactElement => {
  const vertical = useContext(VerticalContext);
  const listRef = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(listRef, vertical);

  const scrollBy = (direction: 1 | -1): void => {
    const list = listRef.current;
    if (!list) return;
    const rtl = !vertical && getComputedStyle(list).direction === "rtl";
    const page = (vertical ? list.clientHeight : list.clientWidth) * 0.8;
    list.scrollBy({
      [vertical ? "top" : "left"]: direction * page * (rtl ? -1 : 1),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth"
    });
  };

  const Previous = vertical ? ChevronUpIcon : ChevronLeftIcon;
  const Next = vertical ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div
      data-tds="tabs-list-container"
      data-tds-scroll-start={edges.start || undefined}
      data-tds-scroll-end={edges.end || undefined}
    >
      <AriaTabList {...props} ref={listRef} data-tds="tabs-list" />
      {/* Not tab stops: the arrow keys already move between tabs */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll to previous tabs"
        hidden={!edges.start}
        data-tds="tabs-scroll"
        data-tds-direction="start"
        onClick={() => {
          scrollBy(-1);
        }}
      >
        <Previous />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll to next tabs"
        hidden={!edges.end}
        data-tds="tabs-scroll"
        data-tds-direction="end"
        onClick={() => {
          scrollBy(1);
        }}
      >
        <Next />
      </button>
    </div>
  );
};

TabsList.displayName = "Tabs.List";

export type TabsTabProps = AriaTabProps;

// A plain-text label gets a hidden semibold copy that reserves the width it
// takes once selected, so selecting doesn't shift the tabs
const reserveLabelWidth = (children: ReactNode): ReactNode =>
  // eslint-disable-next-line @eslint-react/no-children-map -- Only plain-text children are wrapped; elements, like the indicator, pass through untouched
  Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span data-tds="tabs-tab-label">
        {child}
        <span data-tds="tabs-tab-label-reserve" aria-hidden>
          {child}
        </span>
      </span>
    ) : (
      child
    )
  );

export const TabsTab = ({
  children,
  ...props
}: TabsTabProps): React.ReactElement => (
  <AriaTab {...props} data-tds="tabs-tab">
    {composeRenderProps(children, reserveLabelWidth)}
  </AriaTab>
);

TabsTab.displayName = "Tabs.Tab";

export type TabsIndicatorProps = SelectionIndicatorProps;

// Marks the selected tab, and slides to a newly selected one. Put one in each
// Tabs.Tab; only the selected tab's shows
export const TabsIndicator = (
  props: TabsIndicatorProps
): React.ReactElement => {
  return <SelectionIndicator {...props} data-tds="tabs-indicator" />;
};

TabsIndicator.displayName = "Tabs.Indicator";

type SpanProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

export type TabsSeparatorProps = SpanProps;

// A divider at a tab's start, hidden beside the selected tab
export const TabsSeparator = forwardRef<HTMLSpanElement, TabsSeparatorProps>(
  ({ render, ...props }, ref) => {
    const separatorProps = {
      "aria-hidden": true,
      ...props,
      ref,
      "data-tds": "tabs-separator"
    };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
      render(separatorProps, undefined)
    ) : (
      <span {...separatorProps} />
    );
  }
);

TabsSeparator.displayName = "Tabs.Separator";

export type TabsPanelProps = AriaTabPanelProps;

export const TabsPanel = (props: TabsPanelProps): React.ReactElement => {
  return <AriaTabPanel {...props} data-tds="tabs-panel" />;
};

TabsPanel.displayName = "Tabs.Panel";
