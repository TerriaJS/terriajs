'use strict';

/*global require*/
import React from 'react';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import MapInteractionMode from '../../Models/MapInteractionMode';
import ObserveModelMixin from '../ObserveModelMixin';

const PointParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    getInitialState() {
        return {
            value: ''
        };
    },

    onTextChange(e){
        this.setValue(e.target.value);
        this.setState({
            value: e.target.value
        });
    },

    getValue() {
        const cartographic = this.props.parameterValues[this.props.parameter.id];
        if (defined(cartographic)) {
                return CesiumMath.toDegrees(cartographic.longitude) + ',' + CesiumMath.toDegrees(cartographic.latitude);
        } else {
            return '';
        }
    },

    setValue(value){
        const coordinates = value.split(',');
        if (coordinates.length >= 2) {
            this.props.parameterValues[this.props.parameter.id] = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
        }
    },

    selectPointOnMap(){
        const terria = this.props.previewed.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const pickPointMode = new MapInteractionMode({
            message: 'Select a point by clicking on the map.',
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                that.props.parameterValues[that.props.parameter.id] = Ellipsoid.WGS84.cartesianToCartographic(pickedFeatures.pickPosition);
                terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
                that.setState({
                    value: that.getValue()
                });
            }
        });

        that.props.viewState.toggleModal(false);
    },

    render(){
        return <div className=''>
                    <input className='field' type="text" onChange={this.onTextChange} value={this.state.value}/>
                    <button onClick={this.selectPointOnMap} className='btn btn-primary btn-selector'>Select location</button>
                </div>;
    }
});

module.exports = PointParameterEditor;
