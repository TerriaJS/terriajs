import { action } from "mobx";
import { observer } from "mobx-react";
import { KeyboardEventHandler, useState } from "react";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import { BaseModel } from "../../../Models/Definition/Model";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import Checkbox from "../../../Styled/Checkbox";
import Input from "../../../Styled/Input";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import WebFeatureServiceCatalogItemTraits from "../../../Traits/TraitsClasses/WebFeatureServiceCatalogItemTraits";

interface DatePeriodSelectorProps {
  item: BaseModel;
}

const DatePeriodSelector = observer(function DatePeriodSelector({
  item
}: DatePeriodSelectorProps) {
  const [enableTimeFiltering, setEnableTimeFiltering] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // TODO: When enableTimeFiltering is disabled, pull the entire dataset
  // TODO: When the Filter dataset button is pressed, filter the dataset

  if (
    !MappableMixin.isMixedInto(item) ||
    !hasTraits(
      item,
      WebFeatureServiceCatalogItemTraits,
      "timePeriodFilterStart"
    ) ||
    !hasTraits(item, WebFeatureServiceCatalogItemTraits, "timePeriodFilterEnd")
  )
    return null;

  const setFilter = action(
    (startDate: string | undefined, endDate: string | undefined) => {
      item.setTrait(CommonStrata.user, "timePeriodFilterStart", startDate);
      item.setTrait(CommonStrata.user, "timePeriodFilterEnd", endDate);
      item.loadMapItems();
    }
  );

  function toggleTimeFiltering() {
    setEnableTimeFiltering(
      action((enabled: boolean) => {
        if (enabled) {
          setFilter(undefined, undefined);
        }
        return !enabled;
      })
    );
  }

  const enterSubmit: KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Detect enter press
    if (e.nativeEvent.code === "Enter") {
      e.stopPropagation();
      setFilter(startDate, endDate);
    }
  };

  return (
    <Box fullWidth displayInlineBlock padded>
      <Checkbox
        isChecked={enableTimeFiltering}
        onChange={toggleTimeFiltering}
        title="Enable date filtering"
      >
        <TextSpan>Enable date filtering</TextSpan>
      </Checkbox>

      {enableTimeFiltering ? (
        <>
          <Text>Period Start Date</Text>
          <Input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onKeyDown={enterSubmit}
            placeholder="yyyy-mm-dd"
          />
          <Text>Period End Date</Text>
          <Input
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onKeyDown={enterSubmit}
            placeholder="yyyy-mm-dd"
          />
          <Spacing bottom={2} />
          <Button onClick={() => setFilter(startDate, endDate)}>
            Filter dataset
          </Button>
        </>
      ) : null}
    </Box>
  );
});

export default DatePeriodSelector;
