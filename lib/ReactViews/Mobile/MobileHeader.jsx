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

    toggleSearch() {
        this.toggleView(this.props.viewState.mobileViewOptions.search);
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
                        <When
                            condition={this.props.viewState.mobileView !== this.props.viewState.mobileViewOptions.search}>
                            <div className={Styles.groupLeft}>
                                <button type='button'
                                        onClick={this.toggleMenu}
                                        className={Styles.btnMenu}
                                        title='toggle navigation'
                                />
                                <Branding terria={this.props.terria}
                                          version={this.props.version}
                                          onClick={this.refresh}
                                />
                            </div>
                            <div className={Styles.groupRight}>
                                <button type='button'
                                        className={Styles.btnAdd}
                                        onClick={this.onMobileDataCatalogClicked}>
                                    Data
                                </button>
                                <If condition={nowViewingLength > 0}>
                                    <button type='button' className={Styles.btnNowViewing}
                                            onClick={this.onMobileNowViewingClicked}>
                                        <span className={Styles.nowViewingCount}>{nowViewingLength}</span>
                                    </button>
                                </If>
                                <button type='button'
                                        onClick={this.toggleSearch}>
                                        <Icon glyph={Icon.GLYPHS.test}/>
                                        </button>
                            </div>
                        </When>
                        <Otherwise>
                            <div className="form--search-data">
                                <SearchBox searchText={searchState.unifiedSearchText}
                                           onSearchTextChanged={this.changeSearchText}
                                           onDoSearch={this.search}/>
                            </div>
                            <button type='button'
                                    className='btn btn--mobile-search-cancel'
                                    onClick={this.toggleSearch}>
                                cancel
                            </button>
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
                                   searches={this.state.searches}
                />
            </div>
        );
    }
});
module.exports = MobileHeader;
