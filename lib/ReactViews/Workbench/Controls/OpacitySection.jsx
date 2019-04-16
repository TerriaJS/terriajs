'use strict';

import createReactClass from 'create-react-class';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import React from 'react';
import CommonStrata from '../../../Models/CommonStrata';
import hasTraits from '../../../Models/hasTraits';
import RasterLayerTraits from '../../../Traits/RasterLayerTraits';
import Styles from './opacity-section.scss';

const OpacitySection = observer(createReactClass({
    displayName: 'OpacitySection',

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeOpacity(value) {
        const item = this.props.item;
        if (hasTraits(item, RasterLayerTraits, 'opacity')) {
            item.setTrait(CommonStrata.user, 'opacity', value / 100.0);
        }
    },

    render() {
        const item = this.props.item;
        if (!hasTraits(item, RasterLayerTraits, 'opacity') || item.opacity === undefined) {
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
