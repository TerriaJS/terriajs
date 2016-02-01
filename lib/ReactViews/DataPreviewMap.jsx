'use strict';

const React = require('react');
const Terria = require('../Models/Terria');
const TerriaViewer = require('./TerriaViewer.js');
const ViewerMode = require('../Models/ViewerMode');
const defined = require('terriajs-cesium/Source/Core/defined');
const OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
const createCatalogMemberFromType = require('../Models/createCatalogMemberFromType');
const ObserveModelMixin = require('./ObserveModelMixin');

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
        this.terriaPreview.initialView = terria.initialView;
        this.terriaPreview.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

        // TODO: we shouldn't hard code the base map here. (copied from branch analyticsWithCharts)
        const positron = new OpenStreetMapCatalogItem(this.terriaPreview);
        positron.name = 'Positron (Light)';
        positron.url = 'http://basemaps.cartocdn.com/light_all/';
        positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
        positron.opacity = 1.0;
        positron.subdomains = ['a', 'b', 'c', 'd'];
        this.terriaPreview.baseMap = positron;
    },

    componentWillReceiveProps(nextProp) {
        if (defined(this.catalogItem)) {
            this.catalogItem.isEnabled = false;
        }

        const previewed = nextProp.previewedCatalogItem;
        if (previewed && defined(previewed.type)) {
            const type = previewed.type;
            const serializedCatalogItem = previewed.serializeToJson();
            const catalogItem = createCatalogMemberFromType(type, this.terriaPreview);

            catalogItem.updateFromJson(serializedCatalogItem);
            catalogItem.isEnabled = true;
            this.catalogItem = catalogItem;
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
        return (<div className='data-preview-map'>
                    <div className='terria-preview' ref={this.mapIsReady}>
                    </div>
                    <label className='label-preview-badge'></label>
                </div>
                );
    }
});
module.exports = DataPreviewMap;
