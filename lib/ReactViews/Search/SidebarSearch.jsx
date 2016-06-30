'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchHeader from './SearchHeader.jsx';
import SearchResult from './SearchResult.jsx';
import BadgeBar from '../BadgeBar.jsx';
import CustomDataSource from 'terriajs-cesium/Source/DataSources/CustomDataSource';
import Entity from 'terriajs-cesium/Source/DataSources/Entity.js';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import Cartesian3 from 'terriajs-cesium/Source/Core/Cartesian3';
import VerticalOrigin from 'terriajs-cesium/Source/Scene/VerticalOrigin';

import Styles from './sidebar-search.scss';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired
    },

    componentWillMount() {
        this.mapPointerDataSource = new CustomDataSource('Points');
        this.props.terria.dataSources.add(this.mapPointerDataSource);
    },

    componentWillUnmount() {
        this.props.terria.dataSources.remove(this.mapPointerDataSource);
    },

    onLocationClick(result) {
        this.mapPointerDataSource.entities.removeAll();
        const firstPointEntity = new Entity({
            name: result.name,
            position: Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(result.location.longitude, result.location.latitude)),
            description: `${result.location.latitude}, ${result.location.longitude}`,
            billboard: {
                image: require('../../../wwwroot/images/map_pin.svg'),
                scale: 0.65,
                eyeOffset: new Cartesian3(0.0, 0.0, 50.0),
                verticalOrigin: VerticalOrigin.BOTTOM,
            }
        });
        this.mapPointerDataSource.entities.add(firstPointEntity);

        result.clickAction();
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
                    <BadgeBar label="Search Results" badge={searchResultCount}>
                        <button type='button' onClick={this.backToNowViewing}
                                className={Styles.btnDone}>Done
                        </button>
                    </BadgeBar>
                    <For each="search" of={this.props.viewState.searchState.locationSearchProviders}>
                        <div key={search.constructor.name} className={Styles.providerResult}>
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
        );
    }
});
