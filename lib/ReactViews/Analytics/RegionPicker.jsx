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
import MapInteractionMode from '../../Models/MapInteractionMode';
import Styles from './parameter-editors.scss';


const RegionPicker = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        feature: React.PropTypes.object
    },

    componentWillMount() {
        this._loadingRegionProvider = undefined;
        this._selectedRegionCatalogItem = undefined;
        this._displayValue = '';
        this._regionNames = [];
        this._regionsCatalogItem = undefined;
        this.regionProvider = undefined;
        this._subscriptions = [];
        this._lastFeature = undefined;
        this._lastPickedFeatures = undefined;

        const terria = this.props.previewed.terria;

        // handle feature picking
        const that = this;

        knockout.defineProperty(this, 'regionProvider', {
            get: function() {
                return this.props.parameter.getRegionProvider(this.props.previewed.parameterValues);
            }
        });

        this._subscriptions.push(knockout.getObservable(this, 'regionProvider').subscribe(this.addRegionLayer));

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
            }
        });

        knockout.getObservable(this.props.previewed.terria.mapInteractionModeStack[0], 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (!defined(pickedFeatures)) {
                return;
            }
            that._lastPickedFeatures = pickedFeatures;
            when(pickedFeatures.allFeaturesAvailablePromise, function() {
                if (pickedFeatures !== that._lastPickedFeatures || pickedFeatures.features.length === 0) {
                    return;
                }
                that.updateFeature(pickedFeatures.features[0]);
            });
        });

        this.addRegionLayer();
        this.updateMapFromValue();
    },

    componentWillUnmount() {
        this._subscriptions.forEach(subscription => subscription.dispose());
        if (defined(this._regionsCatalogItem)) {
            this._regionsCatalogItem.isEnabled = false;
            this._regionsCatalogItem = undefined;
        }
        if (defined(this._selectedRegionCatalogItem)) {
            this._selectedRegionCatalogItem.isEnabled = false;
            this._selectedRegionCatalogItem = undefined;
        }
    },

    getInitialState() {
        return {
            autocompleteVisible: false,
            autoCompleteOptions: []
        };
    },

    updateFeature(feature) {
        this._lastRegionFeature = feature.data;
        const regionId = feature.properties[this.regionProvider.regionProp];
        this.regionValue = this.props.parameter.findRegionByID(regionId, this.props.previewed.parameterValues);

        this.addSelectedRegionCatalogItem(feature);
    },

    addSelectedRegionCatalogItem(feature) {
        if (defined(this._selectedRegionCatalogItem)) {
            this._selectedRegionCatalogItem.isEnabled = false;
            this._selectedRegionCatalogItem = undefined;
        }

        if (defined(feature.data) && feature.data.type === 'Feature') {
            this._selectedRegionCatalogItem = new GeoJsonCatalogItem(this.props.previewed.terria);
            this._selectedRegionCatalogItem.name = "Selected Polygon";
            this._selectedRegionCatalogItem.data = feature.data;
            this._selectedRegionCatalogItem.isEnabled = true;
            this._selectedRegionCatalogItem.zoomTo();
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
            that._regionsCatalogItem.name = "Available Regions";
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
            that.addSelectedRegionCatalogItem(feature);
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

    textChange(e) {
        // Reset region value
        this.regionValue = undefined;

        if (!defined(e.target.value) || !defined(this.regionProvider)) {
            return;
        }

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
                    if (result.length >= 100) {
                        break;
                    }
                }
            }
        }
        this._displayValue = e.target.value;
        this.setState({
            autocompleteVisible: result.length > 0 && result.length <= 100,
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
        this.updateMapFromValue();
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

    render() {
        return (<div className={Styles.parameterEditor}>
                    <RegionTypeParameterEditor
                            previewed={this.props.previewed}
                            parameter={this.props.parameter.regionProvider}
                    />
                    <input className={Styles.field}
                           type="text"
                           autoComplete="off"
                           value={this.getDisplayValue()}
                           onChange={this.textChange}
                           placeholder="Type a region name or click the map below"
                    />
                    {this.renderOptions()}
                </div>);
    },

    renderOptions() {
        const className = classNames({
            [Styles.autocomplete]: true,
            [Styles.isHidden]: !this.state.autocompleteVisible
        });

        return (
            <ul className={className}>
                {this.state.autoCompleteOptions.map((op, i)=>
                    <li key={i}>
                        <button type='button' className={Styles.autocompleteItem}
                                onClick={this.selectRegion.bind(this, op)}>{op.name}</button>
                    </li>
                )}
            </ul>
        );
    }
});

module.exports = RegionPicker;
