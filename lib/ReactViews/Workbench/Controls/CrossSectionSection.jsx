'use strict';

import CrossSectionSlider from './CrossSectionSlider';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './opacity-section.scss';

const CrossSectionSection = createReactClass({
    displayName: 'CrossSectionSection',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    render() {
        const item = this.props.item;
        if (!item.supportsCrossSection || !item.modelMinimums || !item.modelMaximums) {
            return null;
        }

        return (
            <div className={Styles.opacity}>
                <CrossSectionSlider item={item} isMinimum={true} element={'x'} />
                <CrossSectionSlider item={item} isMinimum={false} element={'x'} />
                <CrossSectionSlider item={item} isMinimum={true} element={'y'} />
                <CrossSectionSlider item={item} isMinimum={false} element={'y'} />
                {/*<CrossSectionSlider item={item} isMinimum={true} element={'z'} />
                <CrossSectionSlider item={item} isMinimum={false} element={'z'} />*/}
            </div>
        );
    },
});
module.exports = CrossSectionSection;
