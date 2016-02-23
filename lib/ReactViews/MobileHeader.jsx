'use strict';
import React from 'react';
import SearchBox from './Search/SearchBox.jsx';
import ObserveModelMixin from './ObserveModelMixin';

const MobileHeader = React.createClass({
    mixins: [ObserveModelMixin],

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
            searchIsOpen: !this.state.searchIsOpen,
            menuIsOpen: false
        });
    },

    toggleMenu() {
        this.setState({
            menuIsOpen: !this.state.menuIsOpen
        });
    },

    onMobileDataCatalogClicked() {
        this.props.viewState.openAddData();
        this.setState({
            searchIsOpen: false,
            menuIsOpen: false
        });
    },

    onMobileNowViewingClicked() {
        this.props.viewState.toggleNowViewing(true);
        this.setState({
            searchIsOpen: false,
            menuIsOpen: false
        });
    },

    onClearMobileUI() {
        this.props.viewState.toggleNowViewing(false);
        this.props.viewState.togglePreview(false);
        this.props.viewState.toggleModal(false);
    },

    search() {

    },
    render() {
        return <div className='mobile__header'>
                    <div className={'mobile__nav ' + (this.state.menuIsOpen ? 'is-open' : '')}>
                      <button className='btn--mobile-menu btn' onClick={this.toggleMenu}>Data</button>
                      <ul className='nav'>
                        <li><button className='btn btn--mobile-nav' onClick={this.onMobileDataCatalogClicked}> Data Catalogue</button></li>
                        <li><button className='btn btn--mobile-nav' onClick={this.onMobileNowViewingClicked}> Now Viewing</button></li>
                      </ul>
                    </div>
                    <div className={'mobile__search ' + (this.state.searchIsOpen ? 'is-open' : '')}>
                      <button className='btn btn--mobile-search' onClick={this.toggleSearch}></button>
                      <SearchBox onSearchTextChanged={this.search}/>
                      <button className='btn btn--mobile-search-cancel' onClick={this.toggleSearch}>cancel</button>
                    </div>
                    {(this.props.viewState.modalVisible || this.props.viewState.isNowViewingOnly) && <button className='btn mobile__clear btn--mobile-clear' onClick={this.onClearMobileUI}>Back to map</button>}
                </div>;
    }
});
module.exports = MobileHeader;
