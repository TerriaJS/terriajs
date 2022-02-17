"use strict";

import i18next from "i18next";
import { debounce } from "lodash-es";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { default as React, default as React, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import InputColor from "react-input-color";
import ReactSelect from "react-select";
import { useTheme } from "styled-components";
import Color from "terriajs-cesium/Source/Core/Color";
import isDefined from "../../../Core/isDefined";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../Models/Definition/Model";
import SelectableDimensions, {
  filterSelectableDimensions,
  isButton,
  isCheckbox,
  isColor,
  isGroup,
  isNumeric,
  isSelect,
  isText,
  Placement,
  SelectableDimension,
  SelectableDimensionButton,
  SelectableDimensionCheckbox,
  SelectableDimensionColor,
  SelectableDimensionEnum,
  SelectableDimensionGroup,
  SelectableDimensionNumeric,
  SelectableDimensionText
} from "../../../Models/SelectableDimensions/SelectableDimensions";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Checkbox from "../../../Styled/Checkbox";
import Input from "../../../Styled/Input";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import Collapsible from "../../Custom/Collapsible/Collapsible";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";

interface PropsType extends WithTranslation {
  item: BaseModel;
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
    if (!SelectableDimensions.is(item)) {
      return null;
    }

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

    if (!isDefined(selectableDimensions) || selectableDimensions.length === 0) {
      return null;
    }

    return (
      <Box displayInlineBlock fullWidth>
        <Spacing bottom={2} />
        {selectableDimensions.map((dim, i) => (
          <DimensionSelector
            key={`${item.uniqueId}-${dim.id}-fragment`}
            id={`${item.uniqueId}-${dim.id}`}
            dim={dim}
          />
        ))}
      </Box>
    );
  }
}

export const DimensionSelector: React.FC<{
  id: string;
  dim: SelectableDimension;
}> = ({ id, dim }) => {
  return (
    <Box displayInlineBlock fullWidth styledPadding="5px 0">
      {/* Render label for all SelectableDimensions except for groups */}
      {dim.name && dim.type !== "group" ? (
        <>
          <label htmlFor={id}>
            <Text textLight medium as="span">
              {parseCustomMarkdownToReactWithOptions(dim.name, {
                inline: true
              })}
              :
            </Text>
          </label>
          <Spacing bottom={1} />
        </>
      ) : null}
      {isCheckbox(dim) && <DimensionSelectorCheckbox id={id} dim={dim} />}
      {isSelect(dim) && <DimensionSelectorSelect id={id} dim={dim} />}
      {isGroup(dim) && <DimensionSelectorGroup id={id} dim={dim} />}
      {isNumeric(dim) && <DimensionSelectorNumeric id={id} dim={dim} />}
      {isText(dim) && <DimensionSelectorText id={id} dim={dim} />}
      {isButton(dim) && <DimensionSelectorButton id={id} dim={dim} />}
      {isColor(dim) && <DimensionSelectorColor id={id} dim={dim} />}
    </Box>
  );
};

export const DimensionSelectorSelect: React.FC<{
  id: string;
  dim: SelectableDimensionEnum;
}> = ({ id, dim }) => {
  const theme = useTheme();

  const undefinedOption = {
    value: undefined,
    label:
      dim.undefinedLabel ??
      i18next.t("workbench.dimensionsSelector.undefinedLabel")
  };

  let options = dim.options?.map(option => ({
    value: option.id,
    label: option.name ?? option.id
  }));

  const selectedOption = dim.selectedId
    ? options?.find(option => option.value === dim.selectedId)
    : undefinedOption;

  if (!options) return null;

  if (typeof dim.selectedId === "undefined" || dim.allowUndefined) {
    options = [undefinedOption, ...options];
  }

  return (
    <ReactSelect
      css={`
        color: ${theme.dark};
      `}
      options={options}
      value={selectedOption}
      onChange={evt => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, evt?.value ?? "")
        );
      }}
      isClearable={dim.allowUndefined}
    />
  );
};

export const DimensionSelectorCheckbox: React.FC<{
  id: string;
  dim: SelectableDimensionCheckbox;
}> = ({ id, dim }) => {
  return (
    <Checkbox
      name={id}
      isChecked={dim.selectedId === "true"}
      onChange={evt =>
        runInAction(() =>
          dim.setDimensionValue(
            CommonStrata.user,
            evt.target.checked ? "true" : "false"
          )
        )
      }
    >
      <Text>
        {dim.options?.find(opt => opt.id === dim.selectedId)?.name ??
          (dim.selectedId === "true" ? "Enabled" : "Disabled")}
      </Text>
    </Checkbox>
  );
};

/**
 * Component to render a SelectableDimensionGroup.
 */
export const DimensionSelectorGroup: React.FC<{
  id: string;
  dim: SelectableDimensionGroup;
}> = ({ id, dim }) => {
  return (
    <Collapsible
      title={dim.name ?? dim.id ?? ""}
      btnRight
      bodyBoxProps={{
        displayInlineBlock: true,
        fullWidth: true
      }}
      bodyTextProps={{ medium: true }}
      isOpen={dim.isOpen}
      onToggle={dim.onToggle}
    >
      {/* recursively render nested dimensions */}
      {filterSelectableDimensions()(dim.selectableDimensions).map(nestedDim => (
        <DimensionSelector
          id={`${id}-${nestedDim.id}`}
          dim={nestedDim}
          key={`${id}-${nestedDim.id}`}
        />
      ))}
    </Collapsible>
  );
};

export const DimensionSelectorNumeric: React.FC<{
  id: string;
  dim: SelectableDimensionNumeric;
}> = ({ id, dim }) => {
  return (
    <Input
      styledHeight={"34px"}
      light
      border
      type="number"
      name={id}
      value={dim.value}
      min={dim.min}
      max={dim.max}
      onChange={evt => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, parseFloat(evt.target.value))
        );
      }}
    />
  );
};

export const DimensionSelectorText: React.FC<{
  id: string;
  dim: SelectableDimensionText;
}> = ({ id, dim }) => {
  return (
    <Input
      styledHeight={"34px"}
      light
      border
      name={id}
      value={dim.value}
      onChange={evt => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, evt.target.value)
        );
      }}
    />
  );
};

export const DimensionSelectorButton: React.FC<{
  id: string;
  dim: SelectableDimensionButton;
}> = ({ id, dim }) => {
  return (
    <RawButton
      onClick={() =>
        runInAction(() => dim.setDimensionValue(CommonStrata.user, true))
      }
      activeStyles
    >
      {parseCustomMarkdownToReactWithOptions(dim.value ?? "", { inline: true })}
    </RawButton>
  );
};

const debounceSetDimensionValue = debounce(
  action((dim: SelectableDimensionColor, value: string) =>
    dim.setDimensionValue(CommonStrata.user, value)
  ),
  100
);

export const DimensionSelectorColor: React.FC<{
  id: string;
  dim: SelectableDimensionColor;
}> = observer(({ id, dim }) => {
  const [color, setColor] = useState<string | undefined>(
    dim.value ? Color.fromCssColorString(dim.value).toCssHexString() : undefined
  );

  return (
    <InputColor
      initialValue={color ?? "#000000"}
      onChange={value => {
        debounceSetDimensionValue(dim, value.hex);
      }}
    />
  );
});

export default withTranslation()(DimensionSelectorSection);
