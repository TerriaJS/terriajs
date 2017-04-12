'use strict';

import RangeSlider from 'react-rangeslider';
import React from 'react';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './opacity-section.scss';

const OpacitySection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeOpacity(value) {
        this.props.item.opacity = value / 100.0;
    },

    render() {
        const item = this.props.item;
        if (!item.supportsOpacity) {
            return null;
        }
        return (
            <div className={Styles.opacity}>
                <label htmlFor="opacity">Opacity: {parseInt(item.opacity * 100, 10)} %</label>
                <RangeSlider className={Styles.rangeSlider} name='opacity' min={0} max={100} step={1} value={item.opacity * 100 | 0} onChange={this.changeOpacity}/>
            </div>
        );
    }
});
module.exports = OpacitySection;
