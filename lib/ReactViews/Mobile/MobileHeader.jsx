import React from 'react';
import SearchBox from '../Search/SearchBox.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import MobileModalWindow from './MobileModalWindow';
import Branding from '../SidePanel/Branding.jsx';
import Styles from './mobile-header.scss';
import Icon from "../Icon.jsx";
import MobileMenu from './MobileMenu';

const MobileHeader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        version: React.PropTypes.string,
        menuItems: React.PropTypes.array
    },

    getInitialState() {
        return {};
    },

    toggleSearch() {
        this.toggleView(this.props.viewState.mobileViewOptions.search);
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

        return (
            <div className={Styles.ui}>
                <div className={Styles.mobileHeader}>
                    <Choose>
                        <When
                            condition={this.props.viewState.mobileView !== this.props.viewState.mobileViewOptions.search}>
                            <div className={Styles.groupLeft}>
                                <button type='button'
                                        onClick={() => this.props.viewState.mobileMenuVisible = true}
                                        className={Styles.btnMenu}
                                        title='toggle navigation'>
                                    <Icon glyph={Icon.GLYPHS.menu}/>
                                </button>
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
                                        onClick={this.toggleSearch}>
                                        <Icon glyph={Icon.GLYPHS.search}/>
                                </button>
                            </div>
                        </When>
                        <Otherwise>
                            <div className={Styles.formSearchData}>
                                <SearchBox searchText={searchState.unifiedSearchText}
                                           onSearchTextChanged={this.changeSearchText}
                                           onDoSearch={this.search}/>
                            </div>
                            <button type='button'
                                    className={Styles.btnCancel}
                                    onClick={this.toggleSearch}>
                                cancel
                            </button>
                        </Otherwise>
                    </Choose>
                </div>
                <MobileMenu menuItems={this.props.menuItems}
                            viewState={this.props.viewState} />
                <MobileModalWindow terria={this.props.terria}
                                   viewState={this.props.viewState}
                                   searches={this.state.searches}
                />
            </div>
        );
    }
});
module.exports = MobileHeader;
