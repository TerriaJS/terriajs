import MenuButton from "../../Map/MenuButton";
import responsiveSwitch from "./ResponsiveSwitch";
import MobileMenuItem from "../../Mobile/MobileMenuItem";

const MenuItem = responsiveSwitch(MenuButton, MobileMenuItem);

export default MenuItem;
