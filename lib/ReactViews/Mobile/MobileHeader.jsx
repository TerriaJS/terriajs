'use strict';
import React from 'react';
import SearchBox from '../Search/SearchBox.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import MobileModalWindow from './MobileModalWindow';
import Branding from '../SidePanel/Branding.jsx';
import Styles from './mobile-header.scss';
import classNames from "classnames";
import Icon from "../Icon.jsx";

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

    showSearch() {
        const viewState = this.props.viewState;
        const mobileView = viewState.mobileView;
        const mobileViewOptions = viewState.mobileViewOptions;
        const searchState = viewState.searchState;
        if (mobileView === mobileViewOptions.data || mobileView === mobileViewOptions.preview) {
            searchState.showMobileCatalogSearch = true;
        } else {
            searchState.showMobileLocationSearch = true;
            this.showLocationSearchResults();
        }
    },

    closeSearch() {
        this.props.viewState.searchState.showMobileLocationSearch = false;
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.switchMobileView(null);
    },

    toggleMenu() {
        this.setState({
            menuIsOpen: !this.state.menuIsOpen
        });
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.switchMobileView(null);
    },

    onMobileDataCatalogClicked() {
        this.toggleView(this.props.viewState.mobileViewOptions.data);
    },

    onMobileNowViewingClicked() {
        this.toggleView(this.props.viewState.mobileViewOptions.nowViewing);
    },

    changeLocationSearchText(newText) {
        this.props.viewState.searchState.locationSearchText = newText;
        this.showLocationSearchResults();
    },

    showLocationSearchResults() {
        const text = this.props.viewState.searchState.locationSearchText;
        if (text && text.length > 0) {
            this.props.viewState.explorerPanelIsVisible = true;
            this.props.viewState.mobileView = this.props.viewState.mobileViewOptions.locationSearchResults;
        } else {
            // TODO: return to the preview mobileView, rather than dropping back to the map
            this.props.viewState.explorerPanelIsVisible = false;
            this.props.viewState.mobileView = null;
        }
    },

    changeCatalogSearchText(newText) {
        this.props.viewState.searchState.catalogSearchText = newText;
    },

    searchLocations() {
        this.props.viewState.searchState.searchLocations();
    },

    searchCatalog() {
        this.props.viewState.searchState.searchCatalog();
    },

    toggleView(viewname) {
        if (this.props.viewState.mobileView !== viewname) {
            this.props.viewState.explorerPanelIsVisible = true;
            this.props.viewState.switchMobileView(viewname);
        } else {
            this.props.viewState.explorerPanelIsVisible = false;
            this.props.viewState.switchMobileView(null);
        }
        this.setState({
            menuIsOpen: false
        });
    },

    onClickFeedback(e) {
        e.preventDefault();
        this.props.viewState.feedbackFormIsVisible = true;
        this.setState({
            menuIsOpen: false
        });
    },

    render() {
        const searchState = this.props.viewState.searchState;
        const nowViewingLength = this.props.terria.nowViewing.items.length;

        let navClassName = classNames(Styles.mobileNav, {
            [Styles.isOpen]: this.state.menuIsOpen
        });

        return (
            <div className={Styles.ui}>
                <div className={Styles.mobileHeader}>
                    <Choose>
                        <When condition={!searchState.showMobileLocationSearch && !searchState.showMobileCatalogSearch}>
                            <div className={Styles.groupLeft}>
                                <button type='button'
                                        onClick={this.toggleMenu}
                                        className={Styles.btnMenu}
                                        title='toggle navigation'>
                                    <Icon glyph={Icon.GLYPHS.menu}/>
                                </button>
                                <Branding terria={this.props.terria}
                                          version={this.props.version}
                                />
                            </div>
                            <div className={Styles.groupRight}>
                                <button type='button'
                                        className={Styles.btnAdd}
                                        onClick={this.onMobileDataCatalogClicked}>
                                    Data
                                    <Icon glyph={Icon.GLYPHS.increase}/>
                                </button>
                                <If condition={nowViewingLength > 0}>
                                    <button type='button' className={Styles.btnNowViewing}
                                            onClick={this.onMobileNowViewingClicked}>
                                        <Icon glyph={Icon.GLYPHS.eye}/>
                                        <span className={Styles.nowViewingCount}>{nowViewingLength}</span>
                                    </button>
                                </If>
                                <button className={Styles.btnSearch}
                                        type='button'
                                        onClick={this.showSearch}>
                                    <Icon glyph={Icon.GLYPHS.search} />
                                </button>
                            </div>
                        </When>
                        <Otherwise>
                            <div className={Styles.formSearchData}>
                                <Choose>
                                    <When condition={searchState.showMobileLocationSearch}>
                                        <SearchBox searchText={searchState.locationSearchText}
                                                   onSearchTextChanged={this.changeLocationSearchText}
                                                   onDoSearch={this.searchLocations}
                                                   searchBoxLabel="Search for locations"
                                                   alwaysShowClear={true}
                                                   onClear={this.closeSearch} />
                                    </When>
                                    <When condition={searchState.showMobileCatalogSearch}>
                                        <SearchBox searchText={searchState.catalogSearchText}
                                                   onSearchTextChanged={this.changeCatalogSearchText}
                                                   onDoSearch={this.searchCatalog}
                                                   searchBoxLabel="Search the catalogue" />
                                    </When>
                                </Choose>
                            </div>
                        </Otherwise>
                    </Choose>
                </div>
                <ul className={navClassName}>
                    <li><a href=''>About</a></li>
                    <li><a href=''>Related maps</a></li>
                    <li><a href=''>Support</a></li>
                    <li><a href='' onClick={this.onClickFeedback}>Give feedback</a>
                    </li>
                </ul>
                <MobileModalWindow terria={this.props.terria}
                                   viewState={this.props.viewState}
                />
            </div>
        );
    }
});
module.exports = MobileHeader;
