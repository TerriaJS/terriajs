'use strict';

const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
const defined = require('terriajs-cesium/Source/Core/defined');
const GeoJsonCatalogItem = require('../../Models/GeoJsonCatalogItem');
const ObserveModelMixin = require('../ObserveModelMixin');
const OpenStreetMapCatalogItem = require('../../Models/OpenStreetMapCatalogItem');
const React = require('react');
const Terria = require('../../Models/Terria');
const TerriaViewer = require('../../ViewModels/TerriaViewer.js');
const ViewerMode = require('../../Models/ViewerMode');
const when = require('terriajs-cesium/Source/ThirdParty/when');
import Styles from './data-preview-map.scss';

/**
 * Leaflet-based preview map that sits within the preview.
 */
const DataPreviewMap = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        previewedCatalogItem: React.PropTypes.object
    },

    getInitialState() {
        return {
            previewBadgeText: 'PREVIEW LOADING...',
        };
    },

    componentWillMount() {
        const terria = this.props.terria;

        this.terriaPreview = new Terria({
            appName: terria.appName + ' preview',
            supportEmail: terria.supportEmail,
            baseUrl: terria.baseUrl,
            cesiumBaseUrl: terria.cesiumBaseUrl
        });

        this.terriaPreview.viewerMode = ViewerMode.Leaflet;
        this.terriaPreview.homeView = terria.homeView;
        this.terriaPreview.initialView = terria.homeView;
        this.terriaPreview.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;
        this._unsubscribeErrorHandler = this.terriaPreview.error.addEventListener(e => {
            if (e.sender === this.props.previewedCatalogItem ||
                (e.sender && e.sender.nowViewingCatalogItem === this.props.previewedCatalogItem)) {
                this._errorPreviewingCatalogItem = true;
                this.setState({
                    previewBadgeText: 'NO PREVIEW AVAILABLE'
                });
            }
        });

        // TODO: we shouldn't hard code the base map here. (copied from branch analyticsWithCharts)
        const positron = new OpenStreetMapCatalogItem(this.terriaPreview);
        positron.name = 'Positron (Light)';
        positron.url = '//global.ssl.fastly.net/light_all/';
        positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
        positron.opacity = 1.0;
        positron.subdomains = ['cartodb-basemaps-a','cartodb-basemaps-b','cartodb-basemaps-c','cartodb-basemaps-d'];
        this.terriaPreview.baseMap = positron;

        this.isZoomedToExtent = false;
        this.lastPreviewedCatalogItem = undefined;
        this.removePreviewFromMap = undefined;
    },

    componentWillUnmount() {
        if (this._unsubscribeErrorHandler) {
            this._unsubscribeErrorHandler();
            this._unsubscribeErrorHandler = undefined;
        }
    },

    componentDidMount() {
        this.updatePreview();
    },

    componentDidUpdate() {
        this.updatePreview();
    },

    updatePreview() {
        if (this.lastPreviewedCatalogItem === this.props.previewedCatalogItem) {
            return;
        }

        this.lastPreviewedCatalogItem = this.props.previewedCatalogItem;

        this.setState({
            previewBadgeText: 'DATA PREVIEW LOADING...'
        });

        this.isZoomedToExtent = false;
        this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);

        if (defined(this.removePreviewFromMap)) {
            this.removePreviewFromMap();
            this.removePreviewFromMap = undefined;
        }

        if (defined(this.rectangleCatalogItem)) {
            this.rectangleCatalogItem.isEnabled = false;
        }

        const previewed = this.props.previewedCatalogItem;
        if (previewed && defined(previewed.type) && previewed.isMappable) {
            const that = this;
            return when(previewed.load()).then(() => {
                // If this item has a separate now viewing item, load it before continuing.
                let nowViewingItem;
                let loadNowViewingItemPromise;
                if (defined(previewed.nowViewingCatalogItem)) {
                    nowViewingItem = previewed.nowViewingCatalogItem;
                    loadNowViewingItemPromise = when(nowViewingItem.load());
                } else {
                    nowViewingItem = previewed;
                    loadNowViewingItemPromise = when();
                }

                return loadNowViewingItemPromise.then(() => {
                    // Now that the item is loaded, add it to the map.
                    // Unless we've started previewing something else in the meantime!
                    if (!that._unsubscribeErrorHandler || previewed !== that.props.previewedCatalogItem) {
                        return;
                    }

                    if (defined(nowViewingItem.showOnSeparateMap)) {
                        if (defined(nowViewingItem.clock) && defined(nowViewingItem.clock.currentTime)) {
                            that.terriaPreview.clock.currentTime = nowViewingItem.clock.currentTime;
                        }

                        this._errorPreviewingCatalogItem = false;
                        that.removePreviewFromMap = nowViewingItem.showOnSeparateMap(that.terriaPreview.currentViewer);

                        if (this._errorPreviewingCatalogItem) {
                            this.setState({
                                previewBadgeText: 'NO PREVIEW AVAILABLE'
                            });
                        } else if (that.removePreviewFromMap) {
                            this.setState({
                                previewBadgeText: 'DATA PREVIEW'
                            });
                        } else {
                            this.setState({
                                previewBadgeText: 'NO PREVIEW AVAILABLE'
                            });
                        }
                    } else {
                        this.setState({
                            previewBadgeText: 'NO PREVIEW AVAILABLE'
                        });
                    }

                    that.updateBoundingRectangle();
                });
            }).otherwise((err) => {
                console.error(err);

                this.setState({
                    previewBadgeText: 'DATA PREVIEW ERROR'
                });
            });
        }
    },

    clickMap() {
        if (!defined(this.props.previewedCatalogItem)) {
            return;
        }

        this.isZoomedToExtent = !this.isZoomedToExtent;

        if (this.isZoomedToExtent) {
            const catalogItem = defaultValue(this.props.previewedCatalogItem.nowViewingCatalogItem, this.props.previewedCatalogItem);
            if (defined(catalogItem.rectangle)) {
                this.terriaPreview.currentViewer.zoomTo(catalogItem.rectangle);
            }
        } else {
            this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);
        }

        this.updateBoundingRectangle();
    },

    updateBoundingRectangle() {
        if (defined(this.rectangleCatalogItem)) {
            this.rectangleCatalogItem.isEnabled = false;
            this.rectangleCatalogItem = undefined;
        }

        let catalogItem = this.props.previewedCatalogItem;
        catalogItem = defaultValue(catalogItem.nowViewingCatalogItem, catalogItem);

        if (!defined(catalogItem) || !defined(catalogItem.rectangle)) {
            return;
        }

        let west = catalogItem.rectangle.west;
        let south = catalogItem.rectangle.south;
        let east = catalogItem.rectangle.east;
        let north = catalogItem.rectangle.north;

        if (!this.isZoomedToExtent) {
            // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
            // the home view, so that it is actually visible.
            const minimumFraction = 0.05;
            const homeView = this.terriaPreview.homeView.rectangle;

            const minimumWidth = (homeView.east - homeView.west) * minimumFraction;
            if ((east - west) < minimumWidth) {
                const center = (east + west) * 0.5;
                west = center - minimumWidth * 0.5;
                east = center + minimumWidth * 0.5;
            }

            const minimumHeight = (homeView.north - homeView.south) * minimumFraction;
            if ((north - south) < minimumHeight) {
                const center = (north + south) * 0.5;
                south = center - minimumHeight * 0.5;
                north = center + minimumHeight * 0.5;
            }
        }

        west = CesiumMath.toDegrees(west);
        south = CesiumMath.toDegrees(south);
        east = CesiumMath.toDegrees(east);
        north = CesiumMath.toDegrees(north);

        this.rectangleCatalogItem = new GeoJsonCatalogItem(this.terriaPreview);
        this.rectangleCatalogItem.data = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        stroke: '#08ABD5',
                        'stroke-width': 2,
                        'stroke-opacity': 1,
                        fill: '#555555',
                        'fill-opacity': 0
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [west, south],
                                [west, north],
                                [east, north],
                                [east, south],
                                [west, south]
                            ]
                        ]
                    }
                }
            ]
        };
        this.rectangleCatalogItem.isEnabled = true;
    },

    mapIsReady(mapContainer) {
        if (mapContainer) {
            const t = TerriaViewer.create(this.terriaPreview, {
                mapContainer: mapContainer
            });
            // disable preview map interaction
            const map = t.terria.leaflet.map;
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            map.dragging.disable();
        }
    },

    render() {
        return (
            <div className={Styles.map} onClick={this.clickMap}>
                <div className={Styles.terriaPreview} ref={this.mapIsReady}/>
                <label className={Styles.badge}>{this.state.previewBadgeText}</label>
            </div>
        );
    }
});
module.exports = DataPreviewMap;
