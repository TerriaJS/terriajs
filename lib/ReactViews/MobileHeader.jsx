'use strict';
import React from 'react';
import Branding from './Branding.jsx';

const MobileHeader = React.createClass({
    render() {
        return <div className='mobile__header'>
                    <Branding onClick={this.props.showWelcome}/>
                    <nav>
                      <label>Data</label>
                      <ul>
                        <li>Data Catalogue</li>
                        <li>Now Viewing</li>
                      </ul>
                    </nav>
                </div>;
    }
});
module.exports = MobileHeader;
