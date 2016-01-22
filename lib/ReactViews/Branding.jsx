'use strict';

import React from 'react';
import ModalTriggerButton from './ModalTriggerButton.jsx';

export default class Branding extends React . Component {
  render() {
    return (
      <div>
        <ModalTriggerButton btnHtml={'<img src="./images/nationalmap-logo.png" alt="national map" width="160" />'} classNames={'logo'} callback={null} activeTab={0}/>
        </div>
      );
  }
}
