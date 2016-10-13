import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const EnumerationParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    getInitialState() {
        return {
            value: this.props.parameter.value
        };
    },

    onChange(e) {
        this.props.parameter.value = e.target.value;
    },

    render() {
        return (<select className={Styles.field}
                        onChange={this.onChange}
                        value={this.props.parameter.value}>
                    {this.props.parameter.possibleValues.map((v, i)=>
                        <option value={v} key={i}>{v}</option>)}
                </select>);
    }
});

module.exports = EnumerationParameterEditor;
