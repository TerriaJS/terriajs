"use strict";

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

import RegionParameterEditorCore from '../../Models/RegionParameterEditorCore';

const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    componentWillMount() {
        if (!defined(this.regionParameterEditorCore)) {
            this.regionParameterEditorCore = new RegionParameterEditorCore(this.props.previewed,
                                                                         this.props.parameter,
                                                                         this.props.viewState);
        }
        var value = this.regionParameterEditorCore.getValue();
        this.setState({
            value: value
        });
    },

    getInitialState() {
        var value = "";
        if (defined(this.regionParameterEditorCore)) {
            value = this.regionParameterEditorCore.getInitialState();
        }
        return {
            value: value
        };
    },

    getValue() {
        return this.regionParameterEditorCore.getValue();
    },

    selectRegionOnMap() {
        this.regionParameterEditorCore.selectOnMap();
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
