import {
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsRoot,
  TabsSeparator,
  TabsTab
} from "./Tabs";

// Compound component, assembled here so Tabs.tsx only exports components
export const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Indicator: TabsIndicator,
  Separator: TabsSeparator,
  Panel: TabsPanel
});

export { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsSeparator, TabsTab };
export type {
  TabsIndicatorProps,
  TabsListProps,
  TabsPanelProps,
  TabsProps,
  TabsSeparatorProps,
  TabsTabProps,
  TabsVariant
} from "./Tabs";
