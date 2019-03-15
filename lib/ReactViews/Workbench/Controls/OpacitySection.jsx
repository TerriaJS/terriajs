'use strict';

import Slider from 'rc-slider';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import CommonStrata from '../../../Models/CommonStrata';

import Styles from './opacity-section.scss';
import AdjustableOpacity from '../../../ModelInterfaces/AdjustableOpacity';

const OpacitySection = observer(createReactClass({
    displayName: 'OpacitySection',

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeOpacity(value) {
        const item = this.props.item;
        if (AdjustableOpacity.implementedBy(item)) {
            item.getOrCreateStratum(CommonStrata.user).opacity = value / 100.0;
        }
    },

    render() {
        const item = this.props.item;
        if (!AdjustableOpacity.implementedBy(item)) {
            return null;
        }
        return (
            <div className={Styles.opacity}>
                <label htmlFor="opacity">Opacity: {parseInt(item.opacity * 100, 10)} %</label>
                <Slider className={Styles.opacitySlider} min={0} max={100} value={item.opacity * 100 | 0} onChange={this.changeOpacity}/>
            </div>
        );
    },
}));

module.exports = OpacitySection;
