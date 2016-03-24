'use strict';
import React from 'react';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';
import PointParameterEditor from './PointParameterEditor';
import RegionParameterEditor from './RegionParameterEditor';
import RegionTypeParameterEditor from './RegionTypeParameterEditor';


const ParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        parameter: React.PropTypes.object,
        onChange: React.PropTypes.func,
        viewState: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    onChange(e) {
        this.props.parameterValues[this.props.parameter.id] = e.target.value;
    },

    renderEditor() {
        switch(this.props.parameter.type) {
        case 'point':
            return <PointParameterEditor previewed={this.props.previewed}
                                         viewState={this.props.viewState}
                                         parameter={this.props.parameter}
                                         parameterValues={this.props.parameterValues}
                    />;
        case 'enumeration':
            return <select className='field'
                           onChange={this.onChange}
                           value={this.props.parameterValues[this.props.parameter.id]}
                    >
                         {this.props.parameter.possibleValues.map((v, i)=>
                            <option value={v} key={i}>{v}</option>)}
                    </select>;
        case 'dateTime':
            return <input className='field'
                          type="datetime-local"
                          placeholder="YYYY-MM-DDTHH:mm:ss.sss"
                          onChange={this.onChange}
                          value={this.props.parameterValues[this.props.parameter.id]}
                    />;
        case 'region':
            return <RegionParameterEditor previewed={this.props.previewed}
                                          parameter={this.props.parameter}
                                          parameterValues={this.props.parameterValues}
                    />;
        case 'regionType':
            return <RegionTypeParameterEditor previewed={this.props.previewed}
                                              parameter={this.props.parameter}
                                              parameterValues={this.props.parameterValues}
                    />;
        default:
            return <input className='field'
                          type="text"
                          onChange={this.onChange}
                          value={this.props.parameterValues[this.props.parameter.id]}
                    />;
        }
    },

    render() {
        return (<form>
                <label>{this.props.parameter.name}</label>
                {this.props.parameter.isRequired && <span>required</span>}
                {this.renderEditor()}
                </form>);
    }
});

module.exports = ParameterEditor;
