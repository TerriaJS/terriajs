import React from 'react';

import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import MapInteractionMode from '../../Models/MapInteractionMode';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const PointParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    getInitialState() {
        return {
            value: this.getValue()
        };
    },

    onTextChange(e) {
        this.setValue(e.target.value);
        this.setState({
            value: e.target.value
        });
    },

    getValue() {
        const cartographic = this.props.previewed.parameterValues[this.props.parameter.id];
        if (defined(cartographic)) {
            return CesiumMath.toDegrees(cartographic.longitude) + ',' + CesiumMath.toDegrees(cartographic.latitude);
        } else {
            return '';
        }
    },

    setValue(value) {
        const coordinates = value.split(',');
        if (coordinates.length >= 2) {
            const value = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
            this.props.previewed.setParameterValue(this.props.parameter.id, value);
        }
    },

    selectPointOnMap() {
        const terria = this.props.previewed.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const pickPointMode = new MapInteractionMode({
            message: 'Select a point by clicking on the map.',
            onCancel: function () {
                terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                const value = Ellipsoid.WGS84.cartesianToCartographic(pickedFeatures.pickPosition);
                that.props.previewed.setParameterValue(that.props.parameter.id, value);
                terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            }
        });

        that.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (
            <div>
                <input className={Styles.fieldParameterEditor}
                       type="text"
                       onChange={this.onTextChange}
                       value={this.state.value}/>
                <button type="button" onClick={this.selectPointOnMap} className={Styles.btnSelector}>
                    Select location
                </button>
            </div>
        );
    }
});

module.exports = PointParameterEditor;
