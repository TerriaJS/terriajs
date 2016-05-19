'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './opacity-section.scss';

const OpacitySection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    changeOpacity(event) {
        this.props.nowViewingItem.opacity = event.target.value;
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;
        if (!nowViewingItem.supportsOpacity) {
            return null;
        }
        return (
            <div className={Styles.opacity}>
                <label htmlFor="opacity">Opacity: </label>
                <input type='range' name='opacity' min='0' max='1' step='0.01' value={nowViewingItem.opacity} onChange={this.changeOpacity}/>
            </div>
        );
    }
});
module.exports = OpacitySection;
