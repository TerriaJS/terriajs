"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import Icon from "../../Icon";
import Styles from "./style-selector-section.scss";
import CommonStrata from "../../../Models/CommonStrata";
import { runInAction } from "mobx";
import SelectableDimensionsMixin from "../../../ModelMixins/SelectableDimensionsMixin";

const DimensionSelectorSection = createReactClass({
  displayName: "DimensionSelectorSection",

  propTypes: {
    item: PropTypes.object.isRequired
  },

  setDimensionValue(dimension, event) {
    runInAction(() => {
      dimension.setDimensionValue(CommonStrata.user, event.target.value);
    });
  },

  render() {
    const item = this.props.item;
    console.log(item);
    if (!SelectableDimensionsMixin.is(item)) {
      return null;
    }
    const selectableDimensions = item.selectableDimensions;

    return (
      <div className={Styles.styleSelector}>
        {selectableDimensions.map(dim => (
          <div key={dim.id} className={Styles.styleSelector}>
            <label className={Styles.title} htmlFor={dim.name}>
              {dim.name}
            </label>
            <select
              className={Styles.field}
              name={dim.id}
              value={dim.selectedId}
              onChange={this.setDimensionValue.bind(this, dim)}
            >
              {dim.options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Icon glyph={Icon.GLYPHS.opened} />
          </div>
        ))}
      </div>
    );
  }
});

export default observer(DimensionSelectorSection);
