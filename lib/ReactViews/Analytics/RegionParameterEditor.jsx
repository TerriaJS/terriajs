"use strict";

import classNames from 'classnames';
import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import when from 'terriajs-cesium/Source/ThirdParty/when';

import GeoJsonCatalogItem from '../../Models/GeoJsonCatalogItem';
import ObserveModelMixin from '../ObserveModelMixin';
import OpenStreetMapCatalogItem from '../../Models/OpenStreetMapCatalogItem';
import Terria from '../../Models/Terria';
import TerriaViewer from '../../ViewModels/TerriaViewer';
import ViewerMode from '../../Models/ViewerMode';
import WebMapServiceCatalogItem from '../../Models/WebMapServiceCatalogItem';

import RegionTypeParameterEditor from './RegionTypeParameterEditor';
import RegionPicker from './RegionPicker';
import MapInteractionMode from '../../Models/MapInteractionMode';
import Styles from './parameter-editors.scss';


const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object
        parameter: React.PropTypes.object
    },

    componentWillMount() {
        this._lastPickedFeatures = undefined;
        this._loadingRegionProvider = undefined;
        this._selectedRegionCatalogItem = undefined;
        this._displayValue = '';
        this._regionNames = [];
        this._regionsCatalogItem = undefined;
        this.regionProvider = undefined;

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
        this.terriaForRegionSelection.error.addEventListener(e => {
            console.log(e);
        });

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
                that.regionValue = that.props.parameter.findRegionByID(feature.properties[that.regionProvider.regionProp]);

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

        knockout.defineProperty(this, 'regionValue', {
            get: function() {
                return this.props.parameter.value;
            },
            set: function(value) {
                if (defined(value) && defined(value.realRegion)) {
                    value = value.realRegion;
                }
                this.props.parameter.value = value;
                this._displayValue = undefined;
                this.updateMapFromValue(this);
            }
        });

        knockout.defineProperty(this, 'regionProvider', {
            get: function() {
                return this.props.parameter.regionProvider;
            }
        });

        knockout.getObservable(this, 'regionProvider').subscribe(this.addRegionLayer);

        this.addRegionLayer();
        this.updateMapFromValue();
    },

    componentDidMount() {
        TerriaViewer.create(this.terriaForRegionSelection, {
            mapContainer: this.refs.mapContainer,
            uiContainer: this.refs.uiContainer
        });
    },

    getInitialState() {
        return {
            value: this.getValue()
        };
    },

    getValue() {
        let value = this.props.previewed.parameterValues[this.props.parameter.id];
        const regionProvider = this.props.parameter.getRegionProvider(this.props.previewed.parameterValues);
        if (!defined(regionProvider) || !defined(value)) {
            return "";
        }
        const index = regionProvider.regions.indexOf(value);

        if (index >= 0 && regionProvider.regionNames[index]) {
            value = regionProvider.regionNames[index];
        } else {
            value = value.id;
        }
        return regionProvider.regionType + ": " + value;
    },

    selectRegionOnMap() {
        const terria = this.props.previewed.terria;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const that = this;
        const pickPointMode = new MapInteractionMode({
            message: 'Select a region on the map',
            onCancel: function () {
                that.props.previewed.terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            },
            buttonText: "Done",
            customUi: function() {
                return (<RegionPicker className={Styles.parameterEditor}
                            previewed={that.props.previewed}
                            parameter={that.props.parameter}
                         />
                        );
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);
        that.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (<div>
                    <input className={Styles.field}
                           type="text"
                           readOnly
                           value={this.state.value}/>
                    <button type="button" onClick={this.selectRegionOnMap} className={Styles.btnSelector}>
                        Select region
                    </button>
                </div>);
    }
});

module.exports = RegionParameterEditor;
