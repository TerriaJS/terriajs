'use strict';

const React = require('react');
const Terria = require('../Models/Terria');
const TerriaViewer = require('./TerriaViewer.js');
const ViewerMode = require('../Models/ViewerMode');
const defined = require('terriajs-cesium/Source/Core/defined');
const OpenStreetMapCatalogItem = require('../Models/OpenStreetMapCatalogItem');
const createCatalogMemberFromType = require('../Models/createCatalogMemberFromType');

const DataPreviewMap = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    componentWillMount() {
        let terria = this.props.terria;

        this.terriaPreview = new Terria({
            appName: terria.appName + 'preview',
            supportEmail: terria.supportEmail,
            baseUrl: terria.baseUrl,
            cesiumBaseUrl: terria.cesiumBaseUrl
        });

        this.terriaPreview.viewerMode = ViewerMode.Leaflet;
        this.terriaPreview.homeView = terria.homeView;
        this.terriaPreview.initialView = terria.initialView;
        this.terriaPreview.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

        // TODO: we shouldn't hard code the base map here. (copyed from branch analyticswithcharts)
        let positron = new OpenStreetMapCatalogItem(this.terriaPreview);
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

        let previewed = nextProp.previewed;
        if (defined(previewed.type)) {
            let type = previewed.type;
            let serializedCatalogItem = previewed.serializeToJson();
            let catalogItem = createCatalogMemberFromType(type, this.terriaPreview);

            catalogItem.updateFromJson(serializedCatalogItem);
            catalogItem.isEnabled = true;
            this.catalogItem = catalogItem;
        }
    },

    shouldComponentUpdate() {
        // it should not re-render the dom element as all the updates on the map are handled by Model
        return false;
    },

    render() {
        const that = this;
        return (<div className='terria-preview' ref={(previewContainer)=>{
            if (previewContainer !== null) {
                const t = TerriaViewer.create(that.terriaPreview, {
                    mapContainer: previewContainer
                });
                // disable preview map interaction
                let map = t.terria.leaflet.map;
                map.touchZoom.disable();
                map.doubleClickZoom.disable();
                map.scrollWheelZoom.disable();
                map.boxZoom.disable();
                map.keyboard.disable();
                map.dragging.disable();
            }
        }}>
            </div>);
    }
});
module.exports = DataPreviewMap;
