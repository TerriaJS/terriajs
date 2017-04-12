'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from "./Icon.jsx";

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
        message: PropTypes.string,
        className: PropTypes.string
    },

    render() {
        return <span className={Styles.loader}>
                  <Icon glyph={Icon.GLYPHS.loader}/>
                  <span>{this.props.message || 'Loading'}</span>
               </span>;
    }
});
module.exports = Loader;
