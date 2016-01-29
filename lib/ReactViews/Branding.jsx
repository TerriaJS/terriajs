'use strict';

import React from 'react';

const Branding = React.createClass({
    propTypes: {
        setWrapperState: React.PropTypes.func
    },

    openModal() {
        this.props.setWrapperState({
            modalWindowIsOpen: true,
            activeTab: 0
        });
    },

    render() {
        return (
        <div>
            <button className='logo btn' onClick={this.openModal}>
                <img src="./images/nationalmap-logo.png" alt="national map" width="160" />
            </button>
        </div>
            );
    }
});

module.exports = Branding;
