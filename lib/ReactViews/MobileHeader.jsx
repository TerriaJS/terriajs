'use strict';
import React from 'react';
import SearchBox from './Search/SearchBox.jsx';

const MobileHeader = React.createClass({
    search() {

    },
    render() {
        return <div className='mobile__header'>
                    <div className='mobile__nav'>
                      <h2 className='btn'>Data</h2>
                      <ul className='nav'>
                        <li>Data Catalogue</li>
                        <li>Now Viewing</li>
                      </ul>
                    </div>
                    <div className='mobile__search'>
                      <button className='btn btn--mobile-search'></button>
                      <SearchBox onSearchTextChanged={this.search}/>
                    </div>
                </div>;
    }
});
module.exports = MobileHeader;
