
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import BadgeBar from '../BadgeBar.jsx';

import Styles from './sidebar-search.scss';

import {addMarker} from './SearchMarkerUtils';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired
    },

    onLocationClick(result) {
        addMarker(this.props.terria, this.props.viewState, result);
        result.clickAction();
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
                            <div key={search.name} className={Styles.providerResult}>
                                <h4 className={Styles.heading}>{search.name}</h4>
                                <SearchHeader searchProvider={search}
                                              isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}/>
                                <ul className={Styles.items}>
                                    { search.searchResults.map((result, i) => (
                                        <SearchResult key={i}
                                                      clickAction={this.onLocationClick.bind(this, result)}
                                                      name={result.name}/>
                                    )) }
                                </ul>
                            </div>
                        </For>
                        <If condition={this.props.viewState.searchState.locationSearchText.length > 0}>
                            <div className={Styles.providerResult}>
                                <h4 className={Styles.heading}>Data Catalog</h4>
                                <ul className={Styles.items}>
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
