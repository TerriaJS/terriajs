'use strict';

const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const createCatalogMemberFromType = require('../Models/createCatalogMemberFromType');
const defined = require('terriajs-cesium/Source/Core/defined');
const GeoJsonCatalogItem = require('../Models/GeoJsonCatalogItem');
const ObserveModelMixin = require('./ObserveModelMixin');
const OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
const React = require('react');
const Terria = require('../Models/Terria');
const TerriaViewer = require('./TerriaViewer.js');
const ViewerMode = require('../Models/ViewerMode');

const DataPreviewMap = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        previewedCatalogItem: React.PropTypes.object
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

        // TODO: we shouldn't hard code the base map here. (copied from branch analyticsWithCharts)
        const positron = new OpenStreetMapCatalogItem(this.terriaPreview);
        positron.name = 'Positron (Light)';
        positron.url = 'http://basemaps.cartocdn.com/light_all/';
        positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
        positron.opacity = 1.0;
        positron.subdomains = ['a', 'b', 'c', 'd'];
        this.terriaPreview.baseMap = positron;

        this.isZoomedToExtent = false;
    },

    componentWillReceiveProps(nextProp) {
        this.isZoomedToExtent = false;
        this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);

        if (defined(this.catalogItem)) {
            this.catalogItem.isEnabled = false;
        }

        if (defined(this.rectangleCatalogItem)) {
            this.rectangleCatalogItem.isEnabled = false;
        }

        const previewed = nextProp.previewedCatalogItem;
        if (previewed && defined(previewed.type)) {
            const type = previewed.type;
            const serializedCatalogItem = previewed.serializeToJson();
            const catalogItem = createCatalogMemberFromType(type, this.terriaPreview);

            catalogItem.updateFromJson(serializedCatalogItem);
            catalogItem.isEnabled = true;
            this.catalogItem = catalogItem;

            const that = this;
            catalogItem.load().then(function() {
                if (previewed !== that.props.previewedCatalogItem || !defined(catalogItem.rectangle)) {
                    return;
                }

                if (defined(that.rectangleCatalogItem)) {
                    that.rectangleCatalogItem.isEnabled = false;
                }

                const west = CesiumMath.toDegrees(catalogItem.rectangle.west);
                const south = CesiumMath.toDegrees(catalogItem.rectangle.south);
                const east = CesiumMath.toDegrees(catalogItem.rectangle.east);
                const north = CesiumMath.toDegrees(catalogItem.rectangle.north);

                that.rectangleCatalogItem = new GeoJsonCatalogItem(that.terriaPreview);
                that.rectangleCatalogItem.data = {
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
                that.rectangleCatalogItem.isEnabled = true;
            });
        }
    },

    clickMap() {
        if (!defined(this.catalogItem)) {
            return;
        }

        this.isZoomedToExtent = !this.isZoomedToExtent;

        if (this.isZoomedToExtent) {
            this.catalogItem.zoomTo();
        } else {
            this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);
        }
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
        return (<div className='data-preview-map' onClick={this.clickMap}>
                    <div className='terria-preview' ref={this.mapIsReady}>
                    </div>
                    <label className='label-preview-badge'></label>
                </div>
                );
    }
});
module.exports = DataPreviewMap;
