'use strict';

/*global require*/
import CameraView from '../../Models/CameraView';
import defined from 'terriajs-cesium/Source/Core/defined';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import GeoJsonCatalogItem from '../../Models/GeoJsonCatalogItem';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import loadView from '../../Core/loadView';
import ObserveModelMixin from '../ObserveModelMixin';
import OpenStreetMapCatalogItem from '../../Models/OpenStreetMapCatalogItem';
import React from 'react';
import Terria from '../../Models/Terria';
import TerriaViewer from '../../ViewModels/TerriaViewer';
import ViewerMode from '../../Models/ViewerMode';
import WebMapServiceCatalogItem from '../../Models/WebMapServiceCatalogItem';
import when from 'terriajs-cesium/Source/ThirdParty/when';


let catalogItem;

const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    _lastPickedFeatures : undefined,
    _loadingRegionProvider : undefined,
    _selectedRegionCatalogItem : undefined,
    regionProvider: undefined,

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object,
    },

    componentWillMount() {
        const terria = this.props.previewed.terria;

        this.terriaForRegionSelection = new Terria({
            appName: terria.appName,
            supportEmail: terria.supportEmail,
            baseUrl: terria.baseUrl,
            cesiumBaseUrl: terria.cesiumBaseUrl
        });

        this.terriaForRegionSelection.viewerMode = ViewerMode.Leaflet;
        this.terriaForRegionSelection.homeView = terria.homeView;
        this.terriaForRegionSelection.initialView = terria.homeView;
        this.terriaForRegionSelection.regionMappingDefinitionsUrl = terria.regionMappingDefinitionsUrl;

        // TODO: we shouldn't hard code the base map here. (copied from branch analyticsWithCharts)
        const positron = new OpenStreetMapCatalogItem(this.terriaForRegionSelection);
        positron.name = 'Positron (Light)';
        positron.url = 'http://basemaps.cartocdn.com/light_all/';
        positron.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';
        positron.opacity = 1.0;
        positron.subdomains = ['a', 'b', 'c', 'd'];
        this.terriaForRegionSelection.baseMap = positron;
        // handle feature picking
        const that = this;
        knockout.getObservable(this.terriaForRegionSelection, 'pickedFeatures').subscribe(function() {
        const pickedFeatures = that.terriaForRegionSelection.pickedFeatures;
        that._lastPickedFeatures = pickedFeatures;
        when(pickedFeatures.allFeaturesAvailablePromise, function() {
        if (pickedFeatures !== that._lastPickedFeatures || pickedFeatures.features.length === 0) {
            return;
        }
        const feature = pickedFeatures.features[0];
        that._lastRegionFeature = feature.data;
        that.regionValue(that.props.parameter.findRegionByID(feature.properties[that.regionProvider.regionProp], that.props.parameterValues));

        if (defined(that._selectedRegionCatalogItem)) {
            that._selectedRegionCatalogItem.isEnabled = false;
            that._selectedRegionCatalogItem = undefined;
        }

        if (defined(feature.data) && feature.data.type === 'Feature') {
            that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.terriaForRegionSelection);
            that._selectedRegionCatalogItem.data = feature.data;
            that._selectedRegionCatalogItem.isEnabled = true;
        }
            });
        });
        knockout.defineProperty(this, 'regionProvider', {
            get: function() {
                return this.props.parameter.getRegionProvider(this.props.parameterValues);
            }
        });
        knockout.getObservable(this, 'regionProvider').subscribe(this.addRegionLayer);
    },
    getInitialState() {
        return {
            displayValue: '',
            autocompleteVisible: false,
            autoCompleteOptions: [],
            regionNames: []
        };
    },

    regionValue(value) {
        if (!arguments.length) {
            return this.props.parameter.getValue(this.props.parameterValues);
        }
        if (defined(value) && defined(value.realRegion)) {
            value = value.realRegion;
        }
        this.props.parameterValues[this.props.parameter.id] = value;
        this.setState({
            displayValue: ''
        });
    },

    textChange(e){
        const result = [];
        const regions = this.props.parameter.getRegionProvider(this.props.parameterValues);
        if(regions && regions.length > 0) {
            for(let i = 0; i < regions.length; i ++) {
                const name = this.state.regionNames[i];
                if (name && name.toLowerCase().indexOf(this.state.displayValue) >= 0) {
                    result.push({
                        name: name,
                        id: regions[i].id,
                        FID: regions[i].FID,
                        realRegion: regions[i]
                    });
                    if (result.length > 100) {
                        break;
                    }
                }
            }
        }

        this.setState({
            autocompleteVisible: this.state.displayValue.length &&
                                 result.length > 0 &&
                                 result.length < 100,
            displayValue: e.target.value,
            autoCompleteOptions: result
        });
    },

    updateMapFromValue() {
        if (!defined(this.regionProvider)) {
            return;
        }

        const value = this.regionValue();
        const parameter = this.props.parameter;
        const parameterValues = this.props.parameterValues;
        const terria = this.props.previewed.terria;

        const that = this;
        this.regionProvider.getRegionFeature(terria, value, that._lastRegionFeature).then(function(feature) {
            if (parameterValues[parameter.id] !== value) {
                // Value has already changed.
                return;
            }

            if (defined(that._selectedRegionCatalogItem)) {
                that._selectedRegionCatalogItem.isEnabled = false;
                that._selectedRegionCatalogItem = undefined;
            }

            if (defined(feature) && feature.type === 'Feature') {
                that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.terriaForRegionSelection);
                that._selectedRegionCatalogItem.data = feature;
                that._selectedRegionCatalogItem.isEnabled = true;
                that._selectedRegionCatalogItem.zoomTo();
            }
        }).otherwise(function() {
            if (parameterValues[parameter.id] !== value) {
                // Value has already changed.
                return;
            }

            if (defined(that._selectedRegionCatalogItem)) {
                that._selectedRegionCatalogItem.isEnabled = false;
                that._selectedRegionCatalogItem = undefined;
            }
        });
    },

    selectRegion(region) {
        this.regionValue(region);
    },

    renderOptions() {
        return <ul>{this.state.autoCompleteOptions.map((op, i)=>
                    <li className="" onClick={this.selectRegion}>{op.name}</li>
                )}
                </ul>;
    },

    mapIsReady(mapContainer) {
        if (mapContainer) {
            const t = TerriaViewer.create(this.terriaForRegionSelection, {
                mapContainer: mapContainer
            });
        }
    },

    addRegionLayer() {
        const that = this;
        if (defined(this._selectedRegionCatalogItem)) {
            this._selectedRegionCatalogItem.isEnabled = false;
            this._selectedRegionCatalogItem = undefined;
        }

        if (!defined(this.regionProvider)) {
            return;
        }

        this._loadingRegionProvider = this.regionProvider;

        when.all([that.regionProvider.loadRegionIDs(), that.regionProvider.loadRegionNames()]).then(function() {
            if (that.regionProvider !== that._loadingRegionProvider) {
                return;
            }
            // that.setState({
            //     regionNames: that.regionProvider.regionNames
            // });

            if (defined(catalogItem)) {
                catalogItem.isEnabled = false;
                catalogItem = undefined;
            }

            catalogItem = new WebMapServiceCatalogItem(that.terriaForRegionSelection);
            catalogItem.url = that.regionProvider.server;
            catalogItem.layers = that.regionProvider.layerName;
            catalogItem.parameters = {
                styles: 'border_black_fill_aqua'
            };
            catalogItem.isEnabled = true;

            that._loadingRegionProvider = undefined;
        });
    },

    render(){
        this.updateMapFromValue();
        return <div>
                    <div className="parameter-editor-text-input">
                        <input className='field' type="text" size="45" autoComplete="off" value={this.state.displayValue} onChange={this.textChange} placeholder="Type a region name or click the map below"/>
                        {this.renderOptions()}
                    </div>
                    <div className="parameter-editor-map-holder">
                        <div className="parameter-editor-map" ref={this.mapIsReady}></div>
                        <div className="parameter-editor-map-ui"></div>
                    </div>
                </div>;
    }
});

module.exports = RegionParameterEditor;
