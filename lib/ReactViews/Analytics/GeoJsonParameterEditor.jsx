'use strict';

import React from 'react';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';

import UserDrawing from '../../Models/UserDrawing';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './parameter-editors.scss';

import PointParameterEditorCore from '../../Models/PointParameterEditorCore';
import PolygonParameterEditorCore from '../../Models/PolygonParameterEditorCore';
import RegionParameterEditorCore from '../../Models/RegionParameterEditorCore';

const GeoJsonParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    componentWillMount() {
        var value = this.state.currentEditorCore.getValue();
        this.setState({
            value: value
        });
    },

    getInitialState() {
        console.log("GET INITIAL STATE");
        var pointEditorCore = new PointParameterEditorCore(this.props.previewed,
                                                           this.props.parameter,
                                                           this.props.viewState);
        var polygonEditorCore = new PolygonParameterEditorCore(this.props.previewed,
                                                               this.props.parameter,
                                                               this.props.viewState);
        var regionEditorCore = new RegionParameterEditorCore(this.props.previewed,
                                                             this.props.parameter,
                                                             this.props.viewState);

        return {
            value: pointEditorCore.getInitialState(),
            pointEditorCore: pointEditorCore,
            polygonEditorCore: polygonEditorCore,
            regionEditorCore: regionEditorCore
        };
    },

    onTextChange(e) {
        this.state.currentEditorCore.onTextChange(e);
        this.setState({
            value: this.state.currentEditorCore.getValue()
        });
    },

    getValue() {
        return this.state.currentEditorCore.getValue();
    },

    setValue(value) {
        this.state.currentEditorCore.setValue(value);
        this.setState({
            value: this.state.currentEditorCore.getValue()
        });
    },

    onCleanUp() {
        this.props.viewState.openAddData();
    },

    selectPointOnMap() {
        this.setState({
            currentEditorCore: this.state.pointEditorCore
        },
        function() {
            this.state.currentEditorCore.selectOnMap();
        });
    },

    selectPolygonOnMap() {
        this.setState({
            currentEditorCore: this.state.polygonEditorCore
        },
        function() {
            this.state.currentEditorCore.selectOnMap();
        });
    },

    selectRegionOnMap() {
        this.setState({
            currentEditorCore: this.state.regionEditorCore
        },
        function() {
            this.state.currentEditorCore.selectOnMap();
        });
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
