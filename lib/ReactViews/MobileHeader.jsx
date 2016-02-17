'use strict';
import React from 'react';
import SearchBox from './Search/SearchBox.jsx';

const MobileHeader = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            searchIsOpen: false,
            menuIsOpen: false
        };
    },

    toggleSearch() {
        this.setState({
            searchIsOpen: !this.state.searchIsOpen
        });
    },

    toggleMenu() {
        this.setState({
            menuIsOpen: !this.state.menuIsOpen
        });
    },

    search() {

    },
    render() {
        return <div className='mobile__header'>
                    <div className={'mobile__nav ' + (this.state.menuIsOpen ? 'is-open' : '')}>
                      <button className='btn--mobile-menu btn' onClick={this.toggleMenu}>Data</button>
                      <ul className='nav'>
                        <li><button className='btn'> Data Catalogue</button></li>
                        <li><button className='btn'> Now Viewing</button></li>
                      </ul>
                    </div>
                    <div className={'mobile__search ' + (this.state.searchIsOpen ? 'is-open' : '')}>
                      <button className='btn btn--mobile-search' onClick={this.toggleSearch}></button>
                      <SearchBox onSearchTextChanged={this.search}/>
                      <button className='btn btn--mobile-search-cancel' onClick={this.toggleSearch}>cancel</button>
                    </div>
                </div>;
    }
});
module.exports = MobileHeader;
