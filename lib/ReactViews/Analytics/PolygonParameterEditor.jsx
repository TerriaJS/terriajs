'use strict';

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './parameter-editors.scss';

import PolygonParameterEditorCore from './PolygonParameterEditorCore';

const PolygonParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    componentWillMount() {
        if (!defined(this.polygonParameterEditorCore)) {
            this.polygonParameterEditorCore = new PolygonParameterEditorCore(this.props.previewed,
                                                                         this.props.parameter,
                                                                         this.props.viewState);
        }
        const value = this.polygonParameterEditorCore.getValue();
        this.setState({
            value: value
        });
    },

    getInitialState() {
        let value = "";
        if (defined(this.polygonParameterEditorCore)) {
            value = this.polygonParameterEditorCore.getInitialState();
        }
        return {
            value: value
        };
    },

    onTextChange(e) {
        this.polygonParameterEditorCore.onTextChange(e);
        this.setState({
            value: e.target.value
        });
    },

    getValue() {
        return this.polygonParameterEditorCore.getValue();
    },

    setValue(value) {
        this.polygonParameterEditorCore.setValue(value);
        this.setState({
            value: value
        });
    },

    selectPolygonOnMap() {
        this.polygonParameterEditorCore.selectOnMap();
    },

    render() {
        return (
            <div>
                <input className={Styles.field}
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
