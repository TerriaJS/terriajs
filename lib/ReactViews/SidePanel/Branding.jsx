'use strict';

import React from 'react';
import Styles from './branding.scss';

const Branding = React.createClass({
    propTypes: {
        onClick: React.PropTypes.func
    },

    render() {
        return (
            <div className={Styles.branding}>
                <button type='button' className={Styles.logoButton} onClick={this.props.onClick}>
                    <img className={Styles.logoImage} src="./images/branding.png" alt="Terria App Name" width="160" />
                </button>
            </div>
        );
    }
});

module.exports = Branding;
