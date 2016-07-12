import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';
import PointParameterEditor from './PointParameterEditor';
import RectangleParameterEditor from './RectangleParameterEditor';
import PolygonParameterEditor from './PolygonParameterEditor';
import RegionParameterEditor from './RegionParameterEditor';
import RegionTypeParameterEditor from './RegionTypeParameterEditor';
import RegionDataParameterEditor from './RegionDataParameterEditor';
import BooleanParameterEditor from './BooleanParameterEditor';
import DateTimeParameterEditor from './DateTimeParameterEditor';
import EnumerationParameterEditor from './EnumerationParameterEditor';
import GenericParameterEditor from './GenericParameterEditor';

import Styles from './parameter-editors.scss';

const ParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        parameter: React.PropTypes.object,
        viewState: React.PropTypes.object,
        parameterValues: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    fieldId: new Date().getTime(),

    renderEditor() {
        switch (this.props.parameter.type) {
            case 'point':
                return (<PointParameterEditor
                    previewed={this.props.previewed}
                    viewState={this.props.viewState}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />);
            case 'rectangle':
                return <RectangleParameterEditor
                    previewed={this.props.previewed}
                    viewState={this.props.viewState}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'polygon':
                return <PolygonParameterEditor
                    previewed={this.props.previewed}
                    viewState={this.props.viewState}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'enumeration':
                return <EnumerationParameterEditor
                    previewed={this.props.previewed}
                    viewState={this.props.viewState}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'dateTime':
                return <DateTimeParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'region':
                return <RegionParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'regionType':
                return <RegionTypeParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'regionData':
                return <RegionDataParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            case 'boolean':
                return <BooleanParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
            default:
                return <GenericParameterEditor
                    previewed={this.props.previewed}
                    parameter={this.props.parameter}
                    parameterValues={this.props.parameterValues}
                />;
        }
    },

    render() {
        return (
            <form>
                <label className={Styles.label}
                       htmlFor={this.fieldId + this.props.parameter.type}>
                    {this.props.parameter.name}
                    {this.props.parameter.isRequired &&
                    <span> (required)</span>
                    }
                </label>
                <div id={this.fieldId + this.props.parameter.type} className={Styles.fieldParameterEditor}>
                    {this.renderEditor()}
                </div>
            </form>
        );
    }
});

module.exports = ParameterEditor;
