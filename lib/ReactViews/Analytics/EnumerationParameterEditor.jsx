'use strict';

/*global require*/
import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

const EnumerationParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    onChange(e) {
        this.props.parameterValues[this.props.parameter.id] = e.target.value;
    },

    render() {
        return (<select className='field'
                        onChange={this.onChange}
                        value={this.props.parameterValues[this.props.parameter.id]}
                >
                    {this.props.parameter.possibleValues.map((v, i)=>
                        <option value={v} key={i}>{v}</option>)}
                </select>);
    }
});

module.exports = EnumerationParameterEditor;
