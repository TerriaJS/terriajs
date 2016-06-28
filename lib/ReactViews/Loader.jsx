'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

import Styles from './loader.scss';

const Loader = React.createClass({
    mixins: [ObserveModelMixin],

    getDefaultProps() {
        return {
            className: '',
            message: 'Loading...'
        };
    },

    propTypes: {
        message: React.PropTypes.string,
        className: React.PropTypes.string
    },

    render() {
        return <span className={Styles.loader}>{this.props.message}</span>;
    }
});
module.exports = Loader;
