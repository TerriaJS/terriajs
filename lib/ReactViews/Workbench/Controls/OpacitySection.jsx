'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './opacity-section.scss';

const OpacitySection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    changeOpacity(event) {
        this.props.item.opacity = event.target.value;
    },

    render() {
        const item = this.props.item;
        if (!item.supportsOpacity) {
            return null;
        }
        return (
            <div className={Styles.opacity}>
                <label htmlFor="opacity">Opacity: </label>
                <input type='range' name='opacity' min='0' max='1' step='0.01' value={item.opacity} onChange={this.changeOpacity}/>
            </div>
        );
    }
});
module.exports = OpacitySection;
