import { observer } from "mobx-react";
import React from "react";
import ChartView from "../../Charts/ChartView";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import Chartable from "../../Models/Chartable";
import { BaseModel } from "../../Models/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
const Spacing: any = require("../../Styled/Spacing").default;
const Text: any = require("../../Styled/Text").default;
const Box: any = require("../../Styled/Box").default;

function isDiscretelyTimeVarying(
  model: BaseModel | DiscretelyTimeVaryingMixin.Instance
): model is DiscretelyTimeVaryingMixin.Instance {
  return "discreteTimesAsSortedJulianDates" in model;
}

interface ChartDisclaimerProps {
  terria: Terria;
  viewState: ViewState;
}

const ChartDisclaimer: React.FC<ChartDisclaimerProps> = ({ terria }) => {
  const chartView = new ChartView(terria);

  const chartableItemsWithDisclaimers: (Chartable &
    DiscretelyTimeVaryingMixin.Instance)[] = chartView.chartableItems
    .filter(isDiscretelyTimeVarying)
    .filter(item => item.chartDisclaimer);
  if (chartableItemsWithDisclaimers.length === 0) return null;
  const uniqueChartDisclaimers = [
    ...new Set(chartableItemsWithDisclaimers.map(i => i.chartDisclaimer))
  ];

  return (
    <Box
      backgroundColor="#9a4b4b"
      column
      css={`
        padding: 0 10px;
        a,
        a:visited {
          color: white;
        }
      `}
    >
      <Spacing bottom={2} />
      {uniqueChartDisclaimers.map(chartDisclaimer => (
        <React.Fragment key={chartDisclaimer}>
          <Text color="white">{parseCustomHtmlToReact(chartDisclaimer!)}</Text>
          <Spacing bottom={2} />
        </React.Fragment>
      ))}
    </Box>
  );
};

export default observer(ChartDisclaimer);
