import React from 'react';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';

import UserDrawing from '../../Models/UserDrawing';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './parameter-editors.scss';

const PolygonParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    getInitialState() {
        return {
            value: this.getValue(),
            userDrawing: new UserDrawing(
                {
                    terria: this.props.previewed.terria,
                    onPointClicked: this.onPointClicked,
                    onCleanUp: this.onCleanUp
                })
        };
    },

    onTextChange(e) {
        this.setValue(e.target.value);
        this.setState({
            value: e.target.value
        });
    },

    getValue() {
        const rawValue = this.props.previewed.parameterValues[this.props.parameter.id];
        if (!defined(rawValue) || rawValue.length < 1) {
            return '';
        }
        const pointsLongLats = rawValue[0];

        let polygon = '';
        for (let i = 0; i < pointsLongLats.length; i++) {
            polygon += '[' + pointsLongLats[i][0].toFixed(3) + ', ' + pointsLongLats[i][1].toFixed(3) + ']';
            if (i !== pointsLongLats.length - 1) {
                polygon += ', ';
            }
        }
        if (polygon.length > 0) {
            return '[' + polygon + ']';
        } else {
            return '';
        }
    },

    setValue(value) {
        this.setState({
            value: value
        });
    },

    onCleanUp() {
        this.props.viewState.openAddData();
    },

    onPointClicked(pointEntities) {
        const pointEnts = pointEntities.entities.values;
        const pointsLongLats = [];
        for (let i=0; i < pointEnts.length; i++) {
            const currentPoint = pointEnts[i];
            const currentPointPos = currentPoint.position.getValue(this.props.previewed.terria.clock.currentTime);
            const cartographic = Ellipsoid.WGS84.cartesianToCartographic(currentPointPos);
            const points = [];
            points.push(CesiumMath.toDegrees(cartographic.longitude));
            points.push(CesiumMath.toDegrees(cartographic.latitude));
            pointsLongLats.push(points);
        }
        this.props.previewed.setParameterValue(this.props.parameter.id, [pointsLongLats]);
    },

    selectPolygonOnMap() {
        this.state.userDrawing.enterDrawMode();
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (
            <div>
                <input className={Styles.parameterEditor}
                       type="text"
                       onChange={this.onTextChange}
                       value={this.state.value}/>
                <button type="button"
                        onClick={this.selectPolygonOnMap}
                        className={Styles.btnSelector}>
                    Click to draw polygon
                </button>
            </div>
        );
    }
});

module.exports = PolygonParameterEditor;
