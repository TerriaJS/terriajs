'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import Icon from "./Icon.jsx";

const Loader = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        message: React.PropTypes.string
    },

    render() {
        return <span className='loader'>
                  <Icon glyph={Icon.GLYPHS.loader}/>
                  {this.props.message || 'Loading'}
               </span>;
    }
});
module.exports = Loader;
