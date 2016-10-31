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

    parameterTypeConverters: [
        {
            id: 'point',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <PointParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'line',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <LineParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'rectangle',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <RectangleParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'polygon',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <PolygonParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'enumeration',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <EnumerationParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'dateTime',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <DateTimeParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'region',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {parameterEditor.renderLabel()}
                                <RegionParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'regionType',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    const regionParam = parameterEditor.props.previewed.parameters.find(function(param) {
                        return (defined(param.regionTypeParameter) && param.regionTypeParameter === parameterEditor.props.parameter);
                    });
                    return (<div>
                                <If condition={regionParam === undefined}>
                                    {this.renderLabel()}
                                    <RegionTypeParameterEditor
                                        previewed={parameterEditor.props.previewed}
                                        parameter={parameterEditor.props.parameter}
                                    />
                                </If>
                                <If condition={!parameterEditor.props.parameter.showInUi}>
                                    <div className="Placeholder for regionType"/>
                                </If>
                            </div>);
                }
            }
        },
        {
            id: 'regionData',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {this.renderLabel()}
                                <RegionDataParameterEditor
                                    previewed={this.props.previewed}
                                    parameter={this.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'boolean',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                                {this.renderLabel()}
                                <BooleanParameterEditor
                                    previewed={this.props.previewed}
                                    parameter={this.props.parameter}
                                />
                            </div>);
                }
            }
        },
        {
            id: 'generic',
            parameterTypeToDiv: function ParameterTypeToDiv(type, parameterEditor) {
                if (type === this.id) {
                    return (<div>
                            {parameterEditor.renderLabel()}
                            <GenericParameterEditor
                                previewed={parameterEditor.props.previewed}
                                parameter={parameterEditor.props.parameter}
                            />
                        </div>);
                }
            }
        }
    ],

    fieldId: new Date().getTime(),

    renderLabel() {
        return (<label key={this.props.parameter.id} className={Styles.label} htmlFor={this.fieldId + this.props.parameter.type}>
                    {this.props.parameter.name}
                    {this.props.parameter.isRequired && <span> (required)</span> }
                </label>);
    },

    renderEditor() {
        for (let i = 0; i < this.parameterTypeConverters.length; ++i) {
            const converter = this.parameterTypeConverters[i];
            const editor = converter.parameterTypeToDiv(this.props.parameter.type, this);
            if (defined(editor)) {
                return editor;
            }
        }
        const genericEditor = this.parameterTypeConverters.find(function(item) { return item.id === 'generic'; });
        return genericEditor.parameterTypeToDiv('generic', this);
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
