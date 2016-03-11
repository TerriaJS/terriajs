'use strict';
import React from 'react';
import SearchBox from './Search/SearchBox.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import MobileModalWindow from './MobileModalWindow';
import Branding from './Branding.jsx';

const MobileHeader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            searchIsOpen: false
        };
    },

    toggleSearch() {
        this.setState({
            searchIsOpen: !this.state.searchIsOpen
        });
    },


    onMobileDataCatalogClicked() {
        this.props.viewState.toggleModal(true);
        this.props.viewState.switchMobileView('data');
        this.setState({
            searchIsOpen: false
        });
    },

    onMobileNowViewingClicked() {
        this.props.viewState.toggleModal(true);
        this.props.viewState.switchMobileView('nowViewing');
        this.setState({
            searchIsOpen: false
        });
    },

    refresh(){
        location.reload();
    },

    search() {

    },
    render() {
        const nowViewingLength = this.props.terria.nowViewing.items.length;
        return <div className='mobile__ui'>
                    <div className='mobile__header'>
                        <button className='btn'>Menu</button>
                        <Branding onClick={this.refresh}/>
                        <button className='btn btn-primary btn--mobile-add' onClick={this.onMobileDataCatalogClicked}>Add Data</button>
                        {(nowViewingLength > 0) && <button className='btn btn-primary btn--now-viewing ' onClick={this.onMobileNowViewingClicked}><span className='now-viewing__count'>{nowViewingLength}</span></button>}
                        <div className={'mobile__search ' + (this.state.searchIsOpen ? 'is-open' : '')}>
                            <button className='btn btn--mobile-search' onClick={this.toggleSearch}></button>
                            <SearchBox onSearchTextChanged={this.search}/>
                            <button className='btn btn--mobile-search-cancel' onClick={this.toggleSearch}>cancel</button>
                        </div>
                    </div>
                    <ul className='mobile__nav'>
                        <li><a href=''>About</a></li>
                        <li><a href=''>Related maps</a></li>
                        <li><a href=''>Support</a></li>
                    </ul>
                    <MobileModalWindow terria={this.props.terria} viewState={this.props.viewState}/>
                </div>;
    }
});
module.exports = MobileHeader;
