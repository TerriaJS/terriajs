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

const DEFAULT_PRIMARY_MAP_MARKER_COLOR = '#08ABD5';
const DEFAULT_SECONDARY_MAP_MARKER_COLOR = '#3F4854';

// Handle any of the three kinds of search based on the props
export default React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        isWaitingForSearchToStart: React.PropTypes.bool,
        terria: React.PropTypes.object.isRequired,
        mapMarkerColorPrimary: React.PropTypes.string,
        mapMarkerColorSecondary: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            mapMarkerColorPrimary: DEFAULT_PRIMARY_MAP_MARKER_COLOR,
            mapMarkerColorSecondary: DEFAULT_SECONDARY_MAP_MARKER_COLOR
        };
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
                image: this.getMarkerIcon(),
                scale: 0.5,
                eyeOffset: new Cartesian3(0.0, 0.0, 50.0),
                verticalOrigin: VerticalOrigin.BOTTOM
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

    getMarkerIcon() {
        const svgAsText = require('!!raw-loader!../../../wwwroot/images/map-pin.svg')
            .replace(/id="Oval-30" fill=".*"/, `id="Oval-30" fill="${this.props.mapMarkerColorPrimary}"`)
            .replace(/id="Oval-31" fill=".*"/, `id="Oval-31" fill="${this.props.mapMarkerColorSecondary}"`);
        return `data:image/svg+xml,${svgAsText}`;
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
            </div>
        );
    }
});
