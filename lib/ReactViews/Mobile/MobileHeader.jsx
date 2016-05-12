'use strict';
import React from 'react';
import SearchBox from '../Search/SearchBox.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import MobileModalWindow from './MobileModalWindow';
import Branding from '../Branding.jsx';

const MobileHeader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        version: React.PropTypes.string
    },

    getInitialState() {
        return {
            menuIsOpen: false
        };
    },

    toggleSearch() {
        this.toggleView(this.props.viewState.mobileViewOptions.search);
    },

    toggleMenu() {
        this.setState({
            menuIsOpen: !this.state.menuIsOpen
        });
        this.props.viewState.toggleModal(false);
        this.props.viewState.switchMobileView(null);
    },

    onMobileDataCatalogClicked() {
        this.toggleView(this.props.viewState.mobileViewOptions.data);
    },

    onMobileNowViewingClicked() {
        this.toggleView(this.props.viewState.mobileViewOptions.nowViewing);
    },

    refresh() {
        location.reload();
    },

    changeSearchText(newText) {
        this.props.viewState.searchState.unifiedSearchText = newText;
    },

    search() {
        this.props.viewState.searchState.searchUnified();
    },

    toggleView(viewname) {
        if(this.props.viewState.mobileView !== viewname) {
            this.props.viewState.toggleModal(true);
            this.props.viewState.switchMobileView(viewname);
        } else {
            this.props.viewState.toggleModal(false);
            this.props.viewState.switchMobileView(null);
        }
        this.setState({
            menuIsOpen: false
        });
    },

    onClickFeedback() {
        this.props.viewState.feedbackFormIsVisible = true;
        this.setState({
            menuIsOpen: false
        });
    },

    render() {
        const searchState = this.props.viewState.searchState;
        const nowViewingLength = this.props.terria.nowViewing.items.length;

        return <div className='mobile__ui'>
                    <div className='mobile__header'>
                        <div className='group group-left'>
                            <button type='button' onClick={this.toggleMenu} className='btn btn--menu btn--menu-mobile' title='toggle navigation'></button>
                            <Branding terria={this.props.terria} version={this.props.version} onClick={this.refresh}/>
                        </div>
                        <div className='group group-right'>
                            <button type='button' className='btn btn-primary btn--mobile-add' onClick={this.onMobileDataCatalogClicked}>Data</button>
                            {(nowViewingLength > 0) && <button type='button' className='btn btn-primary btn--now-viewing ' onClick={this.onMobileNowViewingClicked}><span className='now-viewing__count'>{nowViewingLength}</span></button>}
                            <div className={'mobile__search ' + ((this.props.viewState.mobileView === this.props.viewState.mobileViewOptions.search) ? 'is-open' : '')}>
                                <button type='button' className='btn btn--mobile-search'
                                        onClick={this.toggleSearch}></button>
                                <SearchBox searchText={searchState.unifiedSearchText}
                                           onSearchTextChanged={this.changeSearchText}
                                           onDoSearch={this.search} />
                                <button type='button' className='btn btn--mobile-search-cancel'
                                        onClick={this.toggleSearch}>cancel</button>
                            </div>
                        </div>
                    </div>
                    <ul className={`mobile__nav ${this.state.menuIsOpen ? 'is-open' : ''}`}>
                        <li><a href=''>About</a></li>
                        <li><a href=''>Related maps</a></li>
                        <li><a href=''>Support</a></li>
                        <li><button type="button" className='btn btn-reset' onClick={this.onClickFeedback}>Give feedback</button></li>
                        <li className='social'>Share</li>
                    </ul>
                    <MobileModalWindow terria={this.props.terria}
                                       viewState={this.props.viewState}
                    />
                </div>;
    }
});
module.exports = MobileHeader;
