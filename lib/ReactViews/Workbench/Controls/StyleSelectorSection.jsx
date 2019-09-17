"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import Styles from "./style-selector-section.scss";
import CommonStrata from "../../../Models/CommonStrata";
import { runInAction } from "mobx";

const StyleSelectorSection = createReactClass({
  displayName: "StyleSelectorSection",

  propTypes: {
    item: PropTypes.object.isRequired
  },

  changeStyle(styleSelector, event) {
    runInAction(() => {
      styleSelector.chooseActiveStyle(CommonStrata.user, event.target.value);
    });
  },

  render() {
    const item = this.props.item;
    if (defined(item.styleSelector)) {
      return this.renderSingleStyleSelector(item.styleSelector);
    } else if (defined(item.styleSelectors)) {
      return this.renderMultipleStyleSelectors(item.styleSelectors);
    } else {
      return null;
    }
  },

  renderSingleStyleSelector(styleSelector) {
    const availableStyles = styleSelector.availableStyles;
    if (!defined(availableStyles) || availableStyles.length < 2) {
      return null;
    }

    const label = styleSelector.name && styleSelector.name.length > 0 && (
      <label className={Styles.title} htmlFor={styleSelector.name}>
        {label}
      </label>
    );

    return (
      <div key={styleSelector.id}>
        {label}
        <select
          className={Styles.field}
          name={styleSelector.id}
          value={styleSelector.activeStyleId}
          onChange={this.changeStyle.bind(this, styleSelector)}
        >
          {availableStyles.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    );
  },

  renderMultipleStyleSelectors(styleSelectors) {
    return (
      <div className={Styles.styleSelector}>
        {styleSelectors.map(this.renderSingleStyleSelector)}
      </div>
    );
  }
});

module.exports = observer(StyleSelectorSection);
