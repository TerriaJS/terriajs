import React from 'react';

import DropdownPanel from '../../Map/Panels/DropdownPanel';
import MobilePanel from '../../Map/Panels/MobilePanel';
import responsiveSwitch from './ResponsiveSwitch';

const MenuPanel = responsiveSwitch(MobilePanel, DropdownPanel, 'menu');

export default MenuPanel;
