import React from 'react';
import classNames from 'classnames';

import defined from 'terriajs-cesium/Source/Core/defined';

import DataCatalogMember from './DataCatalogMember.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import SearchHeader from '../Search/SearchHeader.jsx';

import Styles from './data-catalog.scss';

// Displays the data catalog.
const DataCatalog = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    getInitialState() {
        return {
            isScrolling: false
        };
    },

    onTouchStart() {
        this.setState({
            isScrolling: true
        });
    },

    onTouchEnd() {
        this.setState({
            isScrolling: false
        });
    },

    render() {
        const terria = this.props.terria;
        const searchState = this.props.viewState.searchState;
        const isSearching = searchState.catalogSearchText.length > 0;
        const items = (
            isSearching ?
                searchState.catalogSearchProvider.searchResults.map(result => result.catalogItem) :
                terria.catalog.group.items
        ).filter(defined);

        return (
            <ul className={classNames(Styles.dataCatalog, {[Styles.scrolling]: this.state.isScrolling})}
                onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchEnd}>
                <If condition={isSearching}>
                    <label className={Styles.label}>Search results</label>
                    <SearchHeader searchProvider={searchState.catalogSearchProvider}
                                  isWaitingForSearchToStart={searchState.isWaitingToStartCatalogSearch}/>
                </If>
                <For each="item" of={items}>
                    {item !== this.props.terria.catalog.userAddedDataGroup &&
                        <DataCatalogMember viewState={this.props.viewState}
                                           member={item}
                                           manageIsOpenLocally={isSearching}
                                           key={item.uniqueId}
                    />}
                </For>
            </ul>
        );
    }
});

module.exports = DataCatalog;
