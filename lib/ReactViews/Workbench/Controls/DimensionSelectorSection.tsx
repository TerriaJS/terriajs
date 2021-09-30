"use strict";

import i18next from "i18next";
import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import isDefined from "../../../Core/isDefined";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../Models/Definition/Model";
import SelectableDimensions, {
  DEFAULT_PLACEMENT,
  MAX_SELECTABLE_DIMENSION_OPTIONS,
  Placement,
  SelectableDimension
} from "../../../Models/SelectableDimensions";
import Box from "../../../Styled/Box";
import Checkbox from "../../../Styled/Checkbox/Checkbox";
import Select from "../../../Styled/Select";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";

interface PropsType extends WithTranslation {
  item: SelectableDimensions & BaseModel;
  /** Placement used to filter selectableDimensions.placement (eg 'belowLegend) */
  placement: Placement;
}

@observer
class DimensionSelectorSection extends React.Component<PropsType> {
  @action
  setDimensionValue(dimension: SelectableDimension, value: string) {
    dimension.setDimensionValue(CommonStrata.user, value);
  }

  render() {
    const item = this.props.item;

    // Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
    const selectableDimensions = item.selectableDimensions?.filter(dim =>
      // Filter by placement if defined, otherwise use default placement
      dim.placement
        ? dim.placement === this.props.placement
        : this.props.placement === DEFAULT_PLACEMENT &&
          !dim.disable &&
          isDefined(dim.options) &&
          dim.options.length < MAX_SELECTABLE_DIMENSION_OPTIONS &&
          dim.options.length + (dim.allowUndefined ? 1 : 0) > 1
    );

    if (
      !SelectableDimensions.is(item) ||
      !isDefined(selectableDimensions) ||
      selectableDimensions.length === 0
    ) {
      return null;
    }

    return (
      <Box displayInlineBlock fullWidth>
        <Spacing bottom={2} />
        {selectableDimensions.map((dim, i) => (
          <React.Fragment key={`${item.uniqueId}-${dim.id}-fragment`}>
            {dim.name ? (
              <>
                <label htmlFor={`${item.uniqueId}-${dim.id}`}>
                  <Text textLight medium as="span">
                    {dim.name}:
                  </Text>
                </label>
                <Spacing bottom={1} />
              </>
            ) : null}
            {dim.type === "checkbox" ? (
              /* Checkbox Selectable Dimension */
              <Checkbox
                isChecked={dim.selectedId === "true"}
                label={
                  dim.options?.find(opt => opt.id === dim.selectedId)?.name ??
                  (dim.selectedId === "true" ? "Enabled" : "Disabled")
                }
                onChange={evt =>
                  this.setDimensionValue(
                    dim,
                    evt.target.checked ? "true" : "false"
                  )
                }
              />
            ) : (
              /* Select (dropdown) Selectable Dimension (default) */
              <Select
                light
                name={dim.id}
                id={`${item.uniqueId}-${dim.id}`}
                value={
                  typeof dim.selectedId === "undefined"
                    ? "__undefined__"
                    : dim.selectedId
                }
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
                  this.setDimensionValue(dim, evt.target.value)
                }
              >
                {/* If no value as been selected -> add option */}
                {(typeof dim.selectedId === "undefined" ||
                  dim.allowUndefined) && (
                  <option key="__undefined__" value="">
                    {dim.undefinedLabel ??
                      i18next.t("workbench.dimensionsSelector.undefinedLabel")}
                  </option>
                )}
                {dim.options!.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name || option.id}
                  </option>
                ))}
              </Select>
            )}

            {i < selectableDimensions.length - 1 && <Spacing bottom={2} />}
          </React.Fragment>
        ))}
      </Box>
    );
  }
}

export default withTranslation()(DimensionSelectorSection);
