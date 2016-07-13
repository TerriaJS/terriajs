'use strict';

import InputRange from 'react-input-range';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './opacity-section.scss';
import InputRangeStyles from './input-range.scss';

const OpacitySection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    changeOpacity(component, value) {
        this.props.item.opacity = value / 100.0;
    },

    render() {
        const item = this.props.item;
        if (!item.supportsOpacity) {
            return null;
        }
        return (
            <div className={Styles.opacity}>
                <label htmlFor="opacity">Opacity: </label>
                <InputRange classNames={InputRangeStyles} name='opacity' minValue={0} maxValue={100} step={1} value={item.opacity * 100 | 0} onChange={this.changeOpacity}/>
            </div>
        );
    }
});
module.exports = OpacitySection;
