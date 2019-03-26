'use strict';

import Slider from 'rc-slider';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import CommonStrata from '../../../Models/CommonStrata';

import Styles from './opacity-section.scss';
import { hasTrait2 } from '../../../Models/hasTrait';
import mixRasterLayerTraits from '../../../Traits/mixRasterLayerTraits';
import ModelTraits from '../../../Traits/ModelTraits';

const OpacitySection = observer(createReactClass({
    displayName: 'OpacitySection',

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeOpacity(value) {
        const item = this.props.item;
        if (hasTrait2(item, mixRasterLayerTraits(ModelTraits), 'opacity')) {
            item.setTrait('user', 'opacity', value / 100.0);
        }
    },

    render() {
        const item = this.props.item;
        if (!hasTrait2(item, mixRasterLayerTraits(ModelTraits), 'opacity') || item.opacity === undefined) {
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
