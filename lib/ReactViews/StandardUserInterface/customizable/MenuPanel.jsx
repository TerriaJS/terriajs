import React from 'react';

import DropdownPanel from '../../Map/Panels/DropdownPanel';
import MobilePanel from '../../Map/Panels/MobilePanel';
import responsiveSwitch from './ResponsiveSwitch';

const MenuPanel = responsiveSwitch(DropdownPanel, MobilePanel, 'menu');

export default MenuPanel;
