import MenuButton from "../../Map/MenuButton.jsx";
import responsiveSwitch from "./ResponsiveSwitch";
import MobileMenuItem from "./../../Mobile/MobileMenuItem";

const MenuItem = responsiveSwitch(MenuButton, MobileMenuItem);

export default MenuItem;
