'use strict';

import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';
import PointParameterEditor from './PointParameterEditor';
import LineParameterEditor from './LineParameterEditor';
import RectangleParameterEditor from './RectangleParameterEditor';
import PolygonParameterEditor from './PolygonParameterEditor';
import RegionParameterEditor from './RegionParameterEditor';
import RegionTypeParameterEditor from './RegionTypeParameterEditor';
import RegionDataParameterEditor from './RegionDataParameterEditor';
import BooleanParameterEditor from './BooleanParameterEditor';
import DateTimeParameterEditor from './DateTimeParameterEditor';
import EnumerationParameterEditor from './EnumerationParameterEditor';
import GenericParameterEditor from './GenericParameterEditor';
import defined from 'terriajs-cesium/Source/Core/defined';

import Styles from './parameter-editors.scss';

const ParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    fieldId: new Date().getTime(),

    renderLabel() {
        return (<label key={this.props.parameter.id} className={Styles.label} htmlFor={this.fieldId + this.props.parameter.type}>
                    {this.props.parameter.name}
                    {this.props.parameter.isRequired && <span> (required)</span> }
                </label>);
    },

    renderEditor() {
        switch (this.props.parameter.type) {
            case 'point':
                return (
                    <div>
                        {this.renderLabel()}
                        <PointParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'line':
                return (
                    <div>
                        {this.renderLabel()}
                        <LineParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'rectangle':
                return (
                    <div>
                        {this.renderLabel()}
                        <RectangleParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'polygon':
                return (
                    <div>
                        {this.renderLabel()}
                        <PolygonParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'enumeration':
                return (
                    <div>
                        {this.renderLabel()}
                        <EnumerationParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'dateTime':
                return (
                    <div>
                        {this.renderLabel()}
                        <DateTimeParameterEditor
                            previewed={this.props.previewed}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'region':
                return (
                    <div>
                        {this.renderLabel()}
                        <RegionParameterEditor
                            previewed={this.props.previewed}
                            viewState={this.props.viewState}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'regionType': {
                const that = this;
                const regionParam = this.props.previewed.parameters.find(function(param) {
                    return (defined(param.regionTypeParameter) &&
                            param.regionTypeParameter === that.props.parameter);
                });
                return (
                    <div>
                        <If condition={regionParam === undefined}>
                            {this.renderLabel()}
                            <RegionTypeParameterEditor
                                previewed={this.props.previewed}
                                parameter={this.props.parameter}
                            />
                        </If>
                        <If condition={!this.props.parameter.showInUi}>
                            <div className="Placeholder for regionType"/>
                        </If>
                    </div>);
            }
            case 'regionData':
                return (
                    <div>
                        {this.renderLabel()}
                        <RegionDataParameterEditor
                            previewed={this.props.previewed}
                            parameter={this.props.parameter}
                        />
                    </div>);
            case 'boolean':
                return (
                    <div>
                        {this.renderLabel()}
                        <BooleanParameterEditor
                            previewed={this.props.previewed}
                            parameter={this.props.parameter}
                        />
                    </div>);
            default:
                return (
                    <div>
                        {this.renderLabel()}
                        <GenericParameterEditor
                            previewed={this.props.previewed}
                            parameter={this.props.parameter}
                        />
                    </div>);
        }
    },

    render() {
        return (
            <div id={this.fieldId + this.props.parameter.type} className={Styles.fieldParameterEditor}>
                {this.renderEditor()}
            </div>
        );
    }
});

module.exports = ParameterEditor;
