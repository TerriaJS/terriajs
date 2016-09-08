'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './style-selector-section.scss';

const StyleSelectorSection = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    changeStyle(event) {
        const item = this.props.item;
        // TODO: handle multiple layers
        item.styles = event.target.value;
        item.refresh();
    },

    render() {
        const item = this.props.item;

        // This section only makes sense if we have a layer that supports styles.
        if (!defined(item.availableStyles) || !defined(item.styles) || !defined(item.layers) || item.layers.length === 0) {
            return null;
        }

        const layers = item.layers.split(',').map(item => item.trim());

        return (
            <div className={Styles.styleSelector}>
                {layers.map(this.renderStyleSelectorForLayer)}
            </div>
        );
    },

    renderStyleSelectorForLayer(layer) {
        const item = this.props.item;
        const styles = item.availableStyles[layer];
        if (!defined(styles)) {
            return null;
        }

        // TODO: get the friendly title of the layer, instead of the name (ID).
        // TODO: handle multiple layers

        return (
            <div key={layer}>
                <label htmlFor={layer}>{layer} style: </label>
                <select className={Styles.field} name={layer} value={item.styles} onChange={this.changeStyle}>
                    {styles.map(item => <option key={item.name} value={item.name}>{item.title}</option>)}
                </select>
            </div>
        );
    }
});
module.exports = StyleSelectorSection;
