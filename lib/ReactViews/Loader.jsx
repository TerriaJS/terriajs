'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
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
        message: React.PropTypes.string,
        className: React.PropTypes.string
    },

    render() {
        return <span className={Styles.loader}>
                  <Icon glyph={Icon.GLYPHS.loader}/>
                  <span>{this.props.message || 'Loading'}</span>
               </span>;
    }
});
module.exports = Loader;
