import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const EnumerationParameterEditor = createReactClass({
    displayName: 'EnumerationParameterEditor',
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: PropTypes.object,
        parameter: PropTypes.object
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
    },
});

module.exports = EnumerationParameterEditor;
