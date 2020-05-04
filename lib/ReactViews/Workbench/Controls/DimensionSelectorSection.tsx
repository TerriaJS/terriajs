"use strict";

import React from "react";
import { observer } from "mobx-react";
const Icon = require("../../Icon");
import Styles from "./dimension-selector-section.scss";
import CommonStrata from "../../../Models/CommonStrata";
import { runInAction } from "mobx";
import SelectableDimensions, {
  SelectableDimension
} from "../../../Models/SelectableDimensions";

@observer
export default class DimensionSelectorSection extends React.Component<{
  item: SelectableDimensions;
}> {
  setDimensionValue(
    dimension: SelectableDimension,
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    runInAction(() => {
      dimension.setDimensionValue(CommonStrata.user, event.target.value);
    });
  }

  render() {
    const item = this.props.item;
    if (
      !SelectableDimensions.is(item) ||
      item.selectableDimensions.length === 0
    ) {
      return null;
    }

    // Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
    const selectableDimensions = item.selectableDimensions.filter(
      dim => dim.options.length + (dim.allowUndefined ? 1 : 0) > 1
    );

    return (
      <div className={Styles.dimensionSelector}>
        {selectableDimensions.map(dim => (
          <div key={dim.id} className={Styles.dimensionSelector}>
            <label className={Styles.title} htmlFor={dim.name}>
              {dim.name}
            </label>
            <div className={Styles.dimensionSelectorSelect}>
              <select
                className={Styles.field}
                name={dim.id}
                value={
                  typeof dim.selectedId === "undefined"
                    ? "__undefined__"
                    : dim.selectedId
                }
                onChange={this.setDimensionValue.bind(this, dim)}
              >
                {/* If no value as been selected -> add option */}
                {(typeof dim.selectedId === "undefined" ||
                  dim.allowUndefined) && (
                  <option
                    key="__undefined__"
                    value=""
                    className={Styles.dimensionSelectorNoSelection}
                  >
                    Not specified
                  </option>
                )}
                {dim.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <Icon glyph={Icon.GLYPHS.opened} />
            </div>
          </div>
        ))}
      </div>
    );
  }
}
