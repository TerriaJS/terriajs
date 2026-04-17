import { FC } from "react";
import {
  SelectableDimension as SelectableDimensionModel,
  isButton,
  isCheckbox,
  isCheckboxGroup,
  isColor,
  isEnum,
  isGroup,
  isMultiEnum,
  isNumeric,
  isNumericRange,
  isText
} from "../../Models/SelectableDimensions/SelectableDimensions";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";
import { SelectableDimensionButton } from "./Button";
import { SelectableDimensionCheckbox } from "./Checkbox";
import { SelectableDimensionColor } from "./Color";
import { SelectableDimensionGroup } from "./Group";
import { SelectableDimensionNumeric } from "./Numeric";
import { SelectableDimensionNumericRange } from "./NumericRange";
import {
  SelectableDimensionEnum,
  SelectableDimensionEnumMulti as SelectableDimensionMultiEnum
} from "./Select";
import { SelectableDimensionText } from "./Text";

const SelectableDimension: FC<{
  id: string;
  dim: SelectableDimensionModel;
}> = ({ id, dim }) => {
  return (
    <Box
      displayInlineBlock
      fullWidth
      styledMargin="0 0 5px 0"
      className="selectableDimension"
    >
      {/* Render label for all SelectableDimensions except for groups */}
      {dim.name && dim.type !== "group" ? (
        <>
          <label htmlFor={id}>
            <Text textGreyLighter medium as="span">
              {parseCustomMarkdownToReactWithOptions(dim.name, {
                inline: true
              })}
              :
            </Text>
          </label>
          <Spacing bottom={1} />
        </>
      ) : null}
      {dim.description && (
        <>
          <Text textLightDimmed small>
            {dim.description}
          </Text>
          <Spacing bottom={1} />
        </>
      )}
      {isCheckbox(dim) && <SelectableDimensionCheckbox id={id} dim={dim} />}
      {isEnum(dim) && <SelectableDimensionEnum id={id} dim={dim} />}
      {isMultiEnum(dim) && <SelectableDimensionMultiEnum id={id} dim={dim} />}
      {(isGroup(dim) || isCheckboxGroup(dim)) && (
        <SelectableDimensionGroup id={id} dim={dim} />
      )}
      {isNumeric(dim) && <SelectableDimensionNumeric id={id} dim={dim} />}
      {isNumericRange(dim) && (
        <SelectableDimensionNumericRange id={id} dim={dim} />
      )}
      {isText(dim) && <SelectableDimensionText id={id} dim={dim} />}
      {isButton(dim) && <SelectableDimensionButton id={id} dim={dim} />}
      {isColor(dim) && <SelectableDimensionColor id={id} dim={dim} />}
    </Box>
  );
};

export default SelectableDimension;
