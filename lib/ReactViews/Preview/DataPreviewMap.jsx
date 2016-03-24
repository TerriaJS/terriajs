'use strict';

const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const createCatalogMemberFromType = require('../../Models/createCatalogMemberFromType');
const defined = require('terriajs-cesium/Source/Core/defined');
const GeoJsonCatalogItem = require('../../Models/GeoJsonCatalogItem');
const ObserveModelMixin = require('../ObserveModelMixin');
const OpenStreetMapCatalogItem = require('../../Models/OpenStreetMapCatalogItem');
const React = require('react');
const Terria = require('../../Models/Terria');
const TerriaViewer = require('../../ViewModels/TerriaViewer.js');
const ViewerMode = require('../../Models/ViewerMode');

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
        this.componentWillReceiveProps(this.props);
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
                if (previewed !== that.props.previewedCatalogItem) {
                    return;
                }

                that.updateBoundingRectangle();
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

        this.updateBoundingRectangle();
    },

    updateBoundingRectangle() {
        if (defined(this.rectangleCatalogItem)) {
            this.rectangleCatalogItem.isEnabled = false;
            this.rectangleCatalogItem = undefined;
        }

        const catalogItem = this.catalogItem;

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
        return (<div className='data-preview-map' onClick={this.clickMap}>
                    <div className='terria-preview' ref={this.mapIsReady}>
                    </div>
                    <label className='label--preview-badge'></label>
                </div>
                );
    }
});
module.exports = DataPreviewMap;
