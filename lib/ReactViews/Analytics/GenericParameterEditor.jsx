import React from 'react';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const GenericParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: PropTypes.object,
        parameter: PropTypes.object
    },

    onChange(e) {
        this.props.parameter.value = e.target.value;
    },

    render() {
        return (<input className={Styles.field}
                       type="text"
                       onChange={this.onChange}
                       value={this.props.parameter.value}
                />);
    }
});

module.exports = GenericParameterEditor;
