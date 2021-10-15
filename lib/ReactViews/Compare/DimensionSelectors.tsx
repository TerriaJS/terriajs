import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Comparable } from "../../Models/Comparable";
import CommonStrata from "../../Models/Definition/CommonStrata";
import SelectableDimensions, {
  SelectableDimension
} from "../../Models/SelectableDimensions";
import Select from "../../Styled/Select";

type PropsType = {
  item: Comparable;
};

/**
 * This component shows a selector for every dimension the item has.
 */
const DimensionSelectors: React.FC<PropsType> = observer(({ item }) => {
  const selectableDimensions = findAllSelectableDimensions(item);
  return (
    <>
      {selectableDimensions.map(dim => (
        <label key={dim.id}>
          <div>{dim.name || dim.id}</div>
          <DimensionValueSelector
            dimension={dim}
            onChangeDimensionValue={(dimensionValue: string) =>
              dim.setDimensionValue(CommonStrata.user, dimensionValue)
            }
          />
        </label>
      ))}
    </>
  );
});

type DimensionSelectorProps = {
  dimension: SelectableDimension;
  onChangeDimensionValue: (dimensionValue: string) => void;
};

const DimensionValueSelector: React.FC<DimensionSelectorProps> = props => {
  const dim = props.dimension;
  const [t] = useTranslation();
  return (
    <Select
      value={dim.selectedId === "undefined" ? "__undefined__" : dim.selectedId}
      onChange={(ev: React.ChangeEvent<HTMLSelectElement>) =>
        props.onChangeDimensionValue(ev.target.value)
      }
    >
      {/* If no value as been selected -> add option */}
      {(dim.selectedId === undefined || dim.allowUndefined) && (
        <option key="__undefined__" value="">
          {dim.undefinedLabel ?? t("compare.dimensionSelector.undefinedLabel")}
        </option>
      )}
      {dim.options!.map(option => (
        <option key={option.id} value={option.id}>
          {option.name || option.id}
        </option>
      ))}
    </Select>
  );
};

function findAllSelectableDimensions(item: Comparable): SelectableDimension[] {
  if (!SelectableDimensions.is(item)) return [];
  // Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
  return item.selectableDimensions?.filter(
    dim =>
      !dim.disable &&
      dim.options !== undefined &&
      dim.options.length + (dim.allowUndefined ? 1 : 0) > 1
  );
}

export default DimensionSelectors;
