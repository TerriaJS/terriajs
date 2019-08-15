import DropdownPanel from "../../Map/Panels/DropdownPanel";
import MobilePanel from "../../Map/Panels/MobilePanel";
import responsiveSwitch from "./ResponsiveSwitch";

const MenuPanel = responsiveSwitch(DropdownPanel, MobilePanel);

export default MenuPanel;
