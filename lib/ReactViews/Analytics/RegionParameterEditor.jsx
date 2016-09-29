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
import MapInteractionMode from '../../Models/MapInteractionMode';
import Styles from './parameter-editors.scss';


const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
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

        // handle feature picking
        const that = this;

        knockout.defineProperty(this, 'regionValue', {
            get: function() {
                return this.props.parameter.getValue(this.props.previewed.parameterValues);
            },
            set: function(value) {
                if (defined(value) && defined(value.realRegion)) {
                    value = value.realRegion;
                }
                this.props.previewed.setParameterValue(this.props.parameter.id, value);
                this._displayValue = undefined;
                this.updateMapFromValue(this);
            }
        });

        knockout.defineProperty(this, 'regionProvider', {
            get: function() {
                return this.props.parameter.getRegionProvider(this.props.previewed.parameterValues);
            }
        });

        knockout.getObservable(this, 'regionProvider').subscribe(this.addRegionLayer);

        this.addRegionLayer();
        this.updateMapFromValue();
    },

    getInitialState() {
        return {
            autocompleteVisible: false,
            autoCompleteOptions: []
        };
    },

    textChange(e) {
        // Reset region value
        this.regionValue = undefined;

        // if input is empty
        if (!defined(e.target.value)) {
            this.setState({
                autocompleteVisible: false,
                autoCompleteOptions: []
            });
            return;
        }

        // if has text, populate auto complete
        const result = [];
        const regions = this.regionProvider.regions;
        const regionNames = this._regionNames;
        if (regions && regions.length > 0) {
            for (let i = 0; i < regions.length; i++) {
                const name = regionNames[i];
                if (name && name.toLowerCase().indexOf(e.target.value) >= 0) {
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
        this._displayValue = e.target.value;
        this.setState({
            autocompleteVisible: result.length > 0 && result.length < 100,
            autoCompleteOptions: result
        });
    },

    selectRegion(region) {
        this.regionValue = region;
        // After choosing a region from auto complete
        this.setState({
            autocompleteVisible: false,
            autoCompleteOptions: []
        });
    },

    getDisplayValue() {
        const region = this.regionValue;
        if (!defined(region)) {
            return this._displayValue;
        }
        const index = this.regionProvider.regions.indexOf(region);
        if (index >= 0 && this._regionNames[index]) {
            return this._regionNames[index];
        } else {
            return region.id;
        }
    },

    addRegionLayer() {
        const that = this;

        if (!defined(this.regionProvider)) {
            return;
        }

        this._loadingRegionProvider = this.regionProvider;

        when.all([that.regionProvider.loadRegionIDs(), that.regionProvider.loadRegionNames()]).then(function() {
            if (that.regionProvider !== that._loadingRegionProvider) {
                return;
            }
            that._regionNames = that.regionProvider.regionNames;

            if (defined(that._regionsCatalogItem)) {
                that._regionsCatalogItem.isEnabled = false;
                that._regionsCatalogItem = undefined;
            }

            that._regionsCatalogItem = new WebMapServiceCatalogItem(that.props.previewed.terria);
            that._regionsCatalogItem.url = that.regionProvider.server;
            that._regionsCatalogItem.layers = that.regionProvider.layerName;
            that._regionsCatalogItem.parameters = {
                styles: 'border_black_fill_aqua'
            };
            that._regionsCatalogItem.isEnabled = true;

            that._loadingRegionProvider = undefined;
        });
    },

    updateMapFromValue() {
        if (!defined(this.regionProvider)) {
            return;
        }

        if (defined(this._selectedRegionCatalogItem)) {
            this._selectedRegionCatalogItem.isEnabled = false;
            this._selectedRegionCatalogItem = undefined;
        }

        const value = this.regionValue;
        const parameter = this.props.parameter;
        const parameterValues = this.props.previewed.parameterValues;
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
                that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.props.previewed.terria);
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

    selectRegionOnMap() {
        const terria = this.props.previewed.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const pickPointMode = new MapInteractionMode({
            message: 'Select a region on the map',
            onCancel: function () {
            },
            customUi: function() {
                return (<RegionTypeParameterEditor
                            previewed={that.props.previewed}
                            parameter={that.props.parameter.regionProvider}
                        />);
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (!defined(pickedFeatures)) {
                return;
            }
            that._lastPickedFeatures = pickedFeatures;
            when(pickedFeatures.allFeaturesAvailablePromise, function() {
                if (pickedFeatures !== that._lastPickedFeatures || pickedFeatures.features.length === 0) {
                    return;
                }
                const feature = pickedFeatures.features[0];
                that._lastRegionFeature = feature.data;
                that.regionValue = that.props.parameter.findRegionByID(feature.properties[that.regionProvider.regionProp], that.props.previewed.parameterValues);

                if (defined(that._selectedRegionCatalogItem)) {
                    that._selectedRegionCatalogItem.isEnabled = false;
                    that._selectedRegionCatalogItem = undefined;
                }

                if (defined(feature.data) && feature.data.type === 'Feature') {
                    that._selectedRegionCatalogItem = new GeoJsonCatalogItem(that.terriaForRegionSelection);
                    that._selectedRegionCatalogItem.data = feature.data;
                    that._selectedRegionCatalogItem.isEnabled = true;
                }
                terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            });
        });

        that.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (<div>
                    <input className={Styles.field}
                           type="text"
                           onChange={this.onTextChange}
                           value={this.state.value}/>
                    <button type="button" onClick={this.selectRegionOnMap} className={Styles.btnSelector}>
                        Select region
                    </button>
                </div>);
    }
});

module.exports = RegionParameterEditor;
