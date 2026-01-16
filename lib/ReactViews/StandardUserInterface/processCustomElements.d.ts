type GroupElementKeys =
  | "menu"
  | "menuLeft"
  | "nav"
  | "experimentalMenu"
  | "feedback";

declare function processCustomElements(
  isSmallScreen: boolean,
  customUI: React.ReactNode
): Record<GroupElementKeys, React.ReactNode[]>;

export default processCustomElements;
