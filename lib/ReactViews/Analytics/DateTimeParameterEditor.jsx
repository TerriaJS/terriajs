import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

const DateTimeParameterEditor = React.createClass({
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
                        type="datetime-local"
                        placeholder="YYYY-MM-DDTHH:mm:ss.sss"
                        onChange={this.onChange}
                        value={this.props.parameterValues[this.props.parameter.id]}
                />);
    }
});

module.exports = DateTimeParameterEditor;
