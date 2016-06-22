'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

import Styles from './loader.scss';

const Loader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        message: React.PropTypes.string
    },

    render() {
        return <span className={Styles.loader}>{this.props.message || 'Loading'}</span>;
    }
});
module.exports = Loader;
