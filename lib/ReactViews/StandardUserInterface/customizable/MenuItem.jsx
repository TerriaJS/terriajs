import React from 'react';

import MenuButton from '../../Map/MenuButton.jsx';
import responsiveSwitch from './ResponsiveSwitch';
import MobileMenuItem from './../../Mobile/MobileMenuItem';

const MenuItem = responsiveSwitch(MenuButton, MobileMenuItem, 'menu');

export default MenuItem;

