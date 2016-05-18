'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const Loader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        message: React.PropTypes.string
    },

    render() {
        return <span className='loader'>{this.props.message || 'Loading'}</span>;
    }
});
module.exports = Loader;
