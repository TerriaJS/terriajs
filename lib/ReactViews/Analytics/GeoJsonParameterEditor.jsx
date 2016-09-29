import React from 'react';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';

import UserDrawing from '../../Models/UserDrawing';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './parameter-editors.scss';

const GeoJsonParameterEditor = React.createClass({
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

    selectPointOnMap() {
        console.log("select point on map!");
    },

    selectPolygonOnMap() {
        console.log("select polygon on map!");
    },

    selectRegionOnMap() {
        console.log("select region on map!");
    },

    render() {
        return (
            <div>
                <div><strong>Select Location</strong></div>
                <div className="container" style={{"marginTop": "10px",
                    "marginBottom":"10px",
                    "display": "table",
                    "width": "100%"
                    }}>
                    <button type="button"
                            onClick={this.selectPointOnMap}
                            className={Styles.btnLocationSelector}>
                            <strong>Point (lat/lon)</strong>
                    </button>
                    <button type="button"
                            style={{"marginLeft" : "0.5%",
                                    "marginRight" : "0.5%"
                                  }}
                            onClick={this.selectPolygonOnMap}
                            className={Styles.btnLocationSelector}>
                            <strong>Polygon</strong>
                    </button>
                    <button type="button"
                            onClick={this.selectRegionOnMap}
                            className={Styles.btnLocationSelector}>
                            <strong>Region</strong>
                    </button>
                </div>
                <input className={Styles.field}
                       type="text"
                       onChange={this.onTextChange}
                       value={this.state.value}/>
            </div>
        );
    }
});

module.exports = GeoJsonParameterEditor;
