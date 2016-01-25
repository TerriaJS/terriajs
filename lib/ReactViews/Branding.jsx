'use strict';

import React from 'react';
import ModalTriggerButton from './ModalTriggerButton.jsx';

const Branding = React.createClass({
    propTypes: {
        toggleModalWindow: React.PropTypes.func
    },
    render() {
        return (
            <div>
        <ModalTriggerButton btnHtml={'<img src="./images/nationalmap-logo.png" alt="national map" width="160" />'} classNames={'logo'} callback={null} activeTab={0} toggleModalWindow={this.props.toggleModalWindow} />
        </div>
            );
    }
});

module.exports = Branding;
