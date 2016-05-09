'use strict';

import React from 'react';

const Branding = React.createClass({
    propTypes: {
        onClick: React.PropTypes.func
    },

    render() {
        return (
            <div className='branding'>
                <button type='button' className='logo btn btn-transparent' onClick={this.props.onClick}>
                    <img src="./images/branding.png" alt="Terria App Name" width="160" />
                </button>
            </div>
        );
    }
});

module.exports = Branding;
