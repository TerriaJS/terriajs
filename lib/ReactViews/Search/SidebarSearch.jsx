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

const MAP_MARKER_COLOR = '#08ABD5';

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
                image: getMarkerIcon(),
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

function getMarkerIcon() {
    // if (!window.btoa) {
    //     // IE9 can't btoa so they get a crappy black icon (serves them right for making our job harder!!)
    //     return ;
    // } else {
    // Other browsers use the already-downloaded SVG sprite, with a class!
    const svgAsText = require('!!raw-loader!../../../wwwroot/images/icons/location.svg').replace('<svg', `<svg stroke-width="2" stroke-opacity="0.7" stroke="#000000" fill="${MAP_MARKER_COLOR}"`);
    // const svgAsText = `<svg viewBox="0 0 100 100" class="icon ${Styles.mapMarkerSvg}" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="${Icon.GLYPHS.location}"></use></svg>`;
    return `data:image/svg+xml,${svgAsText}`;
    // }
}
