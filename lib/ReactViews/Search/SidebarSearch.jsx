'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import SidePanelHeader from '../SidePanel/SidePanelHeader.jsx';

import Styles from './sidebar-search.scss';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool
    },

    searchInDataCatalog() {
        this.props.viewState.searchInCatalog(this.props.viewState.searchState.locationSearchText);
    },

    backToNowViewing() {
        this.props.viewState.searchState.showLocationSearch = false;
    },

    render() {
        const searchResultCount = this.props.viewState.searchState.locationSearchProviders.reduce((count, result) => count + result.searchResults.length, 0);

        return (
            <div className={Styles.search}>
                <div className={Styles.results}>
                    <SidePanelHeader label="Search Results" badge={searchResultCount}>
                        <button type='button' onClick={this.backToNowViewing}
                                className={Styles.btnDone}>Done
                        </button>
                    </SidePanelHeader>
                    <For each="search" of={this.props.viewState.searchState.locationSearchProviders}>
                        <div key={search.constructor.name} className={Styles.providerResult}>
                            <h4 className={Styles.heading}>{search.name}</h4>
                            <SearchHeader searchProvider={search}
                                          isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}/>
                            <ul className={Styles.items}>
                                { search.searchResults.map((result, i) => (
                                    <SearchResult key={i} clickAction={result.clickAction} name={result.name}/>
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
        );
    }
});
