import MenuButton from "../../Map/MenuButton";
import responsiveSwitch from "./ResponsiveSwitch";
import visibilitySwitch from "./VisibilitySwitch";
import MobileMenuItem from "../../Mobile/MobileMenuItem";

const MenuItem = visibilitySwitch(responsiveSwitch(MenuButton, MobileMenuItem));

export default MenuItem;
