'use strict';

/*global require*/
import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

const GenericParameterEditor = React.createClass({
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
        return (<input className='field'
                       type="text"
                       onChange={this.onChange}
                       value={this.props.parameterValues[this.props.parameter.id]}
                />);
    }
});

module.exports = GenericParameterEditor;
