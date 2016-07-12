import React from 'react';

import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import MapInteractionMode from '../../Models/MapInteractionMode';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const RectangleParameterEditor = React.createClass({
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

    onTextChange(e) {
        this.setValue(e.target.value);
        this.setState({
            value: e.target.value
        });
    },

    getValue() {
        const rect = this.props.parameterValues[this.props.parameter.id];
        if (defined(rect)) {
            return this.outputDegrees(Rectangle.southwest(rect).longitude) + ',' + this.outputDegrees(Rectangle.southwest(rect).latitude) + ' ' + this.outputDegrees(Rectangle.northeast(rect).longitude) + ',' + this.outputDegrees(Rectangle.northeast(rect).latitude);
        } else {
            return '';
        }
    },

    outputDegrees(radian) {
        return CesiumMath.toDegrees(radian).toFixed(2);
    },

    setValue(value) {
        const coordPair = value.split(' ');
        const coords = [];
        for (let i = 0; i < coordPair.length; i++) {
            const coordinates = coordPair[i].split(',');
            if (coordinates.length >= 2) {
                coords.push(Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1])));
            }
        }
        this.props.parameterValues[this.props.parameter.id] = Rectangle.fromCartographicArray(coords);
    },

    selectRectangleOnMap() {
        const terria = this.props.previewed.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const pickPointMode = new MapInteractionMode({
            message: 'Press the SHIFT key and hold down the left mouse button to draw a rectangle',
            drawRectangle: true,
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                terria.selectBox = false;
                that.props.viewState.openAddData();
            }
        });
        terria.selectBox = true;
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function (pickedFeatures) {
            if (pickedFeatures instanceof Rectangle) {
                that.props.parameterValues[that.props.parameter.id] = pickedFeatures;
                terria.mapInteractionModeStack.pop();
                terria.selectBox = false;
                that.props.viewState.openAddData();
                that.setState({
                    value: that.getValue()
                });
            }
        });

        that.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (
            <div>
                <input className={Styles.parameterEditor}
                       type="text"
                       onChange={this.onTextChange}
                       value={this.state.value}/>
                <button type='button'
                        onClick={this.selectRectangleOnMap}
                        className={Styles.btnSelector}>
                    Click to draw rectangle
                </button>
            </div>
        );
    }
});

module.exports = RectangleParameterEditor;
