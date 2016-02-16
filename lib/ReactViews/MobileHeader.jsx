'use strict';
import React from 'react';

const MobileHeader = React.createClass({
    render() {
        return <div className='mobile__header'>
                    <div className='mobile__nav'>
                      <label>Data</label>
                      <ul className='nav'>
                        <li>Data Catalogue</li>
                        <li>Now Viewing</li>
                      </ul>
                    </div>
                </div>;
    }
});
module.exports = MobileHeader;
