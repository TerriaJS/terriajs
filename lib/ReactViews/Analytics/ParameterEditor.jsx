'use strict';

import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

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
import GeoJsonParameterEditor from './GeoJsonParameterEditor';
import defined from 'terriajs-cesium/Source/Core/defined';

import Styles from './parameter-editors.scss';

const ParameterEditor = createReactClass({
    displayName: 'ParameterEditor',
    mixins: [ObserveModelMixin],

    propTypes: {
        parameter: PropTypes.object,
        viewState: PropTypes.object,
        previewed: PropTypes.object,
        parameterViewModel: PropTypes.object
    },

    fieldId: new Date().getTime(),

    renderLabel() {
        return (<label key={this.props.parameter.id} className={Styles.label} htmlFor={this.fieldId + this.props.parameter.type}>
                    {this.props.parameter.name}
                    {this.props.parameter.isRequired && <span> (required)</span> }
                </label>);
    },

    renderEditor() {
        for (let i = 0; i < ParameterEditor.parameterTypeConverters.length; ++i) {
            const converter = ParameterEditor.parameterTypeConverters[i];
            const editor = converter.parameterTypeToDiv(this.props.parameter.type, this);
            if (defined(editor)) {
                return editor;
            }
        }
        const genericEditor = ParameterEditor.parameterTypeConverters.filter(function(item) { return item.id === 'generic'; })[0];
        return genericEditor.parameterTypeToDiv('generic', this);
    },

    render() {
        return (
            <div id={this.fieldId + this.props.parameter.type} className={Styles.fieldParameterEditor}>
                {this.renderEditor()}
            </div>
        );
    },
});

ParameterEditor.parameterTypeConverters = [
    {
        id: 'point',
        parameterTypeToDiv: function PointParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <PointParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'line',
        parameterTypeToDiv: function LineParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <LineParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'rectangle',
        parameterTypeToDiv: function RectangleParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <RectangleParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'polygon',
        parameterTypeToDiv: function PolygonParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <PolygonParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'enumeration',
        parameterTypeToDiv: function EnumerationParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <EnumerationParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'dateTime',
        parameterTypeToDiv: function DateTimeParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <DateTimeParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'region',
        parameterTypeToDiv: function RegionParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <RegionParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    viewState={parameterEditor.props.viewState}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'regionType',
        parameterTypeToDiv: function RegionTypeParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                const regionParam = parameterEditor.props.previewed.parameters.filter(function(param) {
                    return (defined(param.regionTypeParameter) && param.regionTypeParameter === parameterEditor.props.parameter);
                })[0];
                return (<div>
                                <If condition={regionParam === undefined}>
                                    {parameterEditor.renderLabel()}
                                    <RegionTypeParameterEditor
                                        previewed={parameterEditor.props.previewed}
                                        parameter={parameterEditor.props.parameter}
                                        parameterViewModel={parameterEditor.props.parameterViewModel}
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
        parameterTypeToDiv: function RegionDataParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <RegionDataParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'boolean',
        parameterTypeToDiv: function BooleanParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                                {parameterEditor.renderLabel()}
                                <BooleanParameterEditor
                                    previewed={parameterEditor.props.previewed}
                                    parameter={parameterEditor.props.parameter}
                                    parameterViewModel={parameterEditor.props.parameterViewModel}
                                />
                            </div>);
            }
        }
    },
    {
        id: 'geojson',
        parameterTypeToDiv: function GeoJsonParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                            {parameterEditor.renderLabel()}
                             <GeoJsonParameterEditor
                                previewed={parameterEditor.props.previewed}
                                viewState={parameterEditor.props.viewState}
                                parameter={parameterEditor.props.parameter}
                             />
                        </div>);
            }
        }
    },
    {
        id: 'generic',
        parameterTypeToDiv: function GenericParameterToDiv(type, parameterEditor) {
            if (type === this.id) {
                return (<div>
                            {parameterEditor.renderLabel()}
                            <GenericParameterEditor
                                previewed={parameterEditor.props.previewed}
                                parameter={parameterEditor.props.parameter}
                                parameterViewModel={parameterEditor.props.parameterViewModel}
                            />
                        </div>);
            }
        }
    }
];

module.exports = ParameterEditor;
