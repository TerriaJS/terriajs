'use strict';

import React from 'react';

import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import PointParameterEditorCore from '../../Models/PointParameterEditorCore';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const PointParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    componentWillMount() {
        if (!defined(this.pointParameterEditorCore)) {
            this.pointParameterEditorCore = new PointParameterEditorCore(this.props.previewed,
                                                                         this.props.parameter,
                                                                         this.props.viewState);
        }
        var value = this.pointParameterEditorCore.getValue();
        this.setState({
            value: value
        });
    },

    getInitialState() {
        var value = "";
        if (defined(this.pointParameterEditorCore)) {
            value = this.pointParameterEditorCore.getInitialState();
        }
        return {
            value: value
        };
    },

    onTextChange(e) {
        this.pointParameterEditorCore.onTextChange(e);
        this.setState({
            value: this.pointParameterEditorCore.getValue()
        });
    },

    getValue() {
        return this.pointParameterEditorCore.getValue();
    },

    setValue(value) {
        this.pointParameterEditorCore.setValue(value);
    },

    selectPointOnMap() {
        this.pointParameterEditorCore.selectOnMap();
    },

    render() {
        return (
            <div>
                <input className={Styles.field}
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
