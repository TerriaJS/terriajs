"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";
import Icon from "./../../Icon.jsx";

import Styles from "./style-selector-section.scss";

const StyleSelectorSection = createReactClass({
  displayName: "StyleSelectorSection",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired
  },

  changeStyle(layer, event) {
    const item = this.props.item;
    const layers = item.layers.split(",");
    const styles = item.styles.split(",");

    const layerIndex = layers.indexOf(layer.name);
    if (layerIndex === -1) {
      // Not a valid layer?  Something went wrong.
      return;
    }

    styles[layerIndex] = event.target.value;
    item.styles = styles.join(",");
    item.refresh();
  },

  render() {
    const item = this.props.item;

    // This section only makes sense if we have a layer that supports styles.
    if (
      item.disableUserChanges ||
      !defined(item.availableStyles) ||
      !defined(item.styles) ||
      !defined(item.layers) ||
      item.layers.length === 0
    ) {
      return null;
    }

    const layerTitles = item.layerTitles;
    const styles = item.styles.split(",");
    const layers = item.layers.split(",").map((item, i) => ({
      name: item.trim(),
      title: (layerTitles && layerTitles[i]) || item.trim(),
      style: styles[i]
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

    const label =
      item.layers.indexOf(",") >= 0 ? layer.title + " Style" : "Style";

    return (
      <div key={layer.name}>
        <label className={Styles.title} htmlFor={layer.name}>
          {label}
        </label>
        <select
          className={Styles.field}
          name={layer.name}
          value={layer.style}
          onChange={this.changeStyle.bind(this, layer)}
        >
          {styles.map(item => (
            <option key={item.name} value={item.name}>
              {item.title || item.name}
            </option>
          ))}
        </select>
        <Icon glyph={Icon.GLYPHS.opened} />
      </div>
    );
  }
});
module.exports = StyleSelectorSection;
