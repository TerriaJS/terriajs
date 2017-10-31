import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import SearchResult from './SearchResult.jsx';
import BadgeBar from '../BadgeBar.jsx';
import Styles from './sidebar-search.scss';
import LocationSearchResults from './LocationSearchResults.jsx';

import {addMarker} from '../../Models/LocationMarkerUtils';

// Handle any of the three kinds of search based on the props
const SidebarSearch = createReactClass({
    displayName: 'SidebarSearch',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object.isRequired,
        isWaitingForSearchToStart: PropTypes.bool,
        terria: PropTypes.object.isRequired
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.showLocationSearchResults = false;
    },

    onLocationClick(result) {
        addMarker(this.props.terria, this.props.viewState, result);
        result.clickAction();
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
                        <If condition={this.props.viewState.searchState.locationSearchText.length > 0}>
                            <div className={Styles.providerResult}>
                                <ul className={Styles.btnList}>
                                    <SearchResult clickAction={this.searchInDataCatalog}
                                                  showPin={false}
                                                  name={`Search for "${this.props.viewState.searchState.locationSearchText}" in the Data Catalogue`}
                                    />
                                </ul>
                            </div>
                        </If>
                        <For each="search" of={this.props.viewState.searchState.locationSearchProviders}>
                            <LocationSearchResults key={search.name}
                                                   terria={this.props.terria}
                                                   viewState={this.props.viewState}
                                                   search={search}
                                                   onLocationClick={this.onLocationClick}
                                                   isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}

                            />
                        </For>
                    </div>
                </div>
            </div>
        );
    },
});

module.exports = SidebarSearch;

