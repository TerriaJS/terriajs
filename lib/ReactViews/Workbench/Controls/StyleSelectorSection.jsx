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
        if (item.disableUserChanges || !defined(item.availableStyles) || !defined(item.styles) || !defined(item.layers) || item.layers.length === 0) {
            return null;
        }

        const layerTitles = item.layerTitles;
        const layers = item.layers.split(',').map((item, i) => ({
            name: item.trim(),
            title: layerTitles[i] || item.trim()
        }));

        return (
            <div className={Styles.styleSelector}>
                {layers.map(this.renderStyleSelectorForLayer)}
            </div>
        );
    },

    renderStyleSelectorForLayer(layer) {
        const item = this.props.item;
        const styles = item.availableStyles[layer.name];
        if (!defined(styles) || styles.length < 2) {
            return null;
        }

        // TODO: get the friendly title of the layer, instead of the name (ID).
        // TODO: handle multiple layers

        const label = item.layers.indexOf(',') >= 0 ? layer.title + ' Style' : 'Style';

        return (
            <div key={layer}>
                <label htmlFor={layer}>{label}</label>
                <select className={Styles.field} name={layer.name} value={item.styles} onChange={this.changeStyle}>
                    {styles.map(item => <option key={item.name} value={item.name}>{item.title}</option>)}
                </select>
            </div>
        );
    }
});
module.exports = StyleSelectorSection;
