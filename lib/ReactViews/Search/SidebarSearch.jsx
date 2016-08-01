import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import BadgeBar from '../BadgeBar.jsx';
import classNames from 'classnames';
import Icon from "../Icon.jsx";

import Styles from './sidebar-search.scss';

import {addMarker} from './SearchMarkerUtils';

// Handle any of the three kinds of search based on the props
const SidebarSearch = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.showLocationSearchResults = false;
    },

    render() {
        const searchResultCount = this.props.viewState.searchState.locationSearchProviders.reduce((count, result) => count + result.searchResults.length, 0);

        return (
            <div className={Styles.search}>
                <div className={Styles.results}>
                    <BadgeBar label="Search Results" badge={searchResultCount}>
                        <button type='button' onClick={this.backToNowViewing}
                                className={Styles.btnDone}>Done
                        </button>
                    </BadgeBar>
                    <div className={Styles.resultsContent}>
                        <For each="search" of={this.props.viewState.searchState.locationSearchProviders}>
                            <LocationSearchResults key={search.name}
                                                   terria={this.props.terria}
                                                   viewState={this.props.viewState}
                                                   search={search}
                                                   isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}

                            />
                        </For>
                        <If condition={this.props.viewState.searchState.locationSearchText.length > 0}>
                            <div className={Styles.providerResult}>
                                <h4 className={Styles.heading}>Data Catalog</h4>
                                <ul className={Styles.btnList}>
                                    <SearchResult clickAction={this.searchInDataCatalog}
                                                  showPin={false}
                                                  name={`Search ${this.props.viewState.searchState.locationSearchText} in the Data Catalog`}
                                    />
                                </ul>
                            </div>
                        </If>
                    </div>
                </div>
            </div>
        );
    }
});

const LocationSearchResults = React.createClass({
    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired,
        search: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isOpen: true
        };
    },

    toggleGroup() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    onLocationClick(result) {
        addMarker(this.props.terria, this.props.viewState, result);
        result.clickAction();
    },

    render() {
        const search = this.props.search;
        return (<div key={search.name} className={classNames(Styles.providerResult, {[Styles.isOpen]: this.state.isOpen})}>
                    <button onClick={this.toggleGroup} className={Styles.heading}>
                        <span>{search.name}</span>
                        <Icon glyph={this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}/>
                    </button>
                    <SearchHeader searchProvider={search}
                                  isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}/>
                    <ul className={Styles.items}>
                        {search.searchResults.map((result, i) => (
                            <SearchResult key={i}
                                          clickAction={this.onLocationClick.bind(this, result)}
                                          name={result.name}/>
                        ))}
                    </ul>
                </div>);
    }
});

module.exports = SidebarSearch;

