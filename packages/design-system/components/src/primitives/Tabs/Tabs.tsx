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
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode
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
import { ScrollShadow, type ScrollShadowVisibility } from "../ScrollShadow";
import { dataAttr } from "../../utils/dataAttr";
import "./Tabs.css";

type TabsVariant = "primary" | "secondary";

// Tabs.List lays out its scroll arrows by the root's orientation
const VerticalContext = createContext(false);

type TabsProps = AriaTabsProps & {
  /** primary: tabs in a pill; secondary: tabs on an underline */
  variant?: TabsVariant;
  /** Stretches the tab list to its container, sharing the width equally */
  fullWidth?: boolean;
};

// Holds a Tabs.List and a Tabs.Panel for each tab
const TabsRoot = ({
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
        data-tds-full-width={dataAttr(fullWidth)}
      />
    </VerticalContext.Provider>
  );
};

TabsRoot.displayName = "Tabs";

type TabsListProps<T extends object = object> = AriaTabListProps<T>;

// The pill, or the underline, holding the tabs. When they don't fit, the
// list scrolls in a ScrollShadow, its ends fade, and arrows scroll it a page
// at a time. The arrows sit beside the list, not in it: a tablist holds only
// tabs
const TabsList = <T extends object>(
  props: TabsListProps<T>
): React.ReactElement => {
  const vertical = useContext(VerticalContext);
  const listRef = useRef<HTMLDivElement>(null);
  const [shadows, setShadows] = useState<ScrollShadowVisibility>("none");
  const edges = {
    start: shadows === "both" || shadows === (vertical ? "top" : "left"),
    end: shadows === "both" || shadows === (vertical ? "bottom" : "right")
  };

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
    <div data-tds="tabs-list-container">
      <ScrollShadow
        ref={listRef}
        orientation={vertical ? "vertical" : "horizontal"}
        hideScrollBar
        onVisibilityChange={setShadows}
        // Each variant fades by its own amount
        style={
          {
            "--terria-ds-scroll-shadow-size": "var(--_tabs-fade)"
          } as CSSProperties
        }
      >
        <AriaTabList {...props} data-tds="tabs-list" />
      </ScrollShadow>
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

type TabsTabProps = AriaTabProps;

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

const TabsTab = ({ children, ...props }: TabsTabProps): React.ReactElement => (
  <AriaTab {...props} data-tds="tabs-tab">
    {composeRenderProps(children, reserveLabelWidth)}
  </AriaTab>
);

TabsTab.displayName = "Tabs.Tab";

type TabsIndicatorProps = SelectionIndicatorProps;

// Marks the selected tab, and slides to a newly selected one. Put one in each
// Tabs.Tab; only the selected tab's shows
const TabsIndicator = (props: TabsIndicatorProps): React.ReactElement => {
  return <SelectionIndicator {...props} data-tds="tabs-indicator" />;
};

TabsIndicator.displayName = "Tabs.Indicator";

type SpanProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

type TabsSeparatorProps = SpanProps;

// A divider at a tab's start, hidden beside the selected tab
const TabsSeparator = forwardRef<HTMLSpanElement, TabsSeparatorProps>(
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

type TabsPanelProps = AriaTabPanelProps;

const TabsPanel = (props: TabsPanelProps): React.ReactElement => {
  return <AriaTabPanel {...props} data-tds="tabs-panel" />;
};

TabsPanel.displayName = "Tabs.Panel";

export { TabsRoot, TabsList, TabsTab, TabsIndicator, TabsSeparator, TabsPanel };
export type {
  TabsVariant,
  TabsProps,
  TabsListProps,
  TabsTabProps,
  TabsIndicatorProps,
  TabsSeparatorProps,
  TabsPanelProps
};
