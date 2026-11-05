import type { ComponentType } from "react";
import DropdownPanel from "../../Map/Panels/DropdownPanel";
import MobilePanel from "../../Map/Panels/MobilePanel";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import responsiveSwitch from "./ResponsiveSwitch";

// ResponsiveSwitch is untyped JS, so its props would be inferred from propTypes
// alone. Until MenuPanel is converted, its props are unchecked here rather than
// with @ts-expect-error at each call site.
const MenuPanel = withControlledVisibility(
  responsiveSwitch(DropdownPanel, MobilePanel)
) as ComponentType<Record<string, unknown>>;

export default MenuPanel;
