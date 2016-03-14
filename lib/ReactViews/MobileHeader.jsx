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
            menuIsOpen: false
        };
    },

    toggleSearch() {
        this.toggleView('search');
    },

    toggleMenu() {
        this.setState({
            menuIsOpen: !this.state.menuIsOpen
        });
    },

    onMobileDataCatalogClicked() {
        this.toggleView('data');
    },

    onMobileNowViewingClicked() {
        this.toggleView('nowViewing');
    },

    refresh(){
        location.reload();
    },

    search() {

    },

    toggleView(viewname){
        if(this.props.viewState.mobileView !== this.props.viewState.mobileViewOptions[viewname]) {
            this.props.viewState.toggleModal(true);
            this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions[viewname]);
        } else {
            this.props.viewState.toggleModal(false);
            this.props.viewState.switchMobileView(null);
        }
        this.setState({
            menuIsOpen: false
        });
    },

    render() {
        const nowViewingLength = this.props.terria.nowViewing.items.length;
        return <div className='mobile__ui'>
                    <div className='mobile__header'>
                        <div className='group group-left'>
                            <button onClick={this.toggleMenu} className='btn btn--menu btn--menu-mobile' title='toggle navigation'></button>
                            <Branding onClick={this.refresh}/>
                        </div>
                        <div className='group group-right'>
                            <button className='btn btn-primary btn--mobile-add' onClick={this.onMobileDataCatalogClicked}>Data</button>
                            {(nowViewingLength > 0) && <button className='btn btn-primary btn--now-viewing ' onClick={this.onMobileNowViewingClicked}><span className='now-viewing__count'>{nowViewingLength}</span></button>}
                            <div className={'mobile__search ' + ((this.props.viewState.mobileView === this.props.viewState.mobileViewOptions.search) ? 'is-open' : '')}>
                                <button className='btn btn--mobile-search' onClick={this.toggleSearch}></button>
                                <SearchBox onSearchTextChanged={this.search}/>
                                <button className='btn btn--mobile-search-cancel' onClick={this.toggleSearch}>cancel</button>
                            </div>
                        </div>
                    </div>
                    <ul className={`mobile__nav ${this.state.menuIsOpen ? 'is-open' : ''}`}>
                        <li><a href=''>About</a></li>
                        <li><a href=''>Related maps</a></li>
                        <li><a href=''>Support</a></li>
                    </ul>
                    <MobileModalWindow terria={this.props.terria} viewState={this.props.viewState}/>
                </div>;
    }
});
module.exports = MobileHeader;
