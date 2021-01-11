import DropdownPanel from "../../Map/Panels/DropdownPanel";
import MobilePanel from "../../Map/Panels/MobilePanel";
import visibilitySwitch from "./VisibilitySwitch";
import responsiveSwitch from "./ResponsiveSwitch";

const MenuPanel = visibilitySwitch(
  responsiveSwitch(DropdownPanel, MobilePanel)
);

export default MenuPanel;
