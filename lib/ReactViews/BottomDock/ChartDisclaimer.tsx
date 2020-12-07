import { observer } from "mobx-react";
import React from "react";
import ChartView from "../../Charts/ChartView";
import filterOutUndefined from "../../Core/filterOutUndefined";
import hasTraits from "../../Models/hasTraits";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import DiscretelyTimeVaryingTraits from "../../Traits/DiscretelyTimeVaryingTraits";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
const Spacing: any = require("../../Styled/Spacing").default;
const Text: any = require("../../Styled/Text").default;
const Box: any = require("../../Styled/Box").default;

interface ChartDisclaimerProps {
  terria: Terria;
  viewState: ViewState;
}

const ChartDisclaimer: React.FC<ChartDisclaimerProps> = ({ terria }) => {
  const chartView = new ChartView(terria);

  const uniqueChartDisclaimers: string[] = [
    ...new Set(
      filterOutUndefined(
        chartView.chartItems.map(chartItem =>
          chartItem.showInChartPanel &&
          hasTraits(
            chartItem.item,
            DiscretelyTimeVaryingTraits,
            "chartDisclaimer"
          )
            ? chartItem.item.chartDisclaimer
            : undefined
        )
      )
    )
  ];

  if (uniqueChartDisclaimers.length === 0) return null;

  return (
    <Box
      backgroundColor="#9a4b4b"
      column
      paddedHorizontally={2}
      css={`
        a,
        a:visited {
          color: white;
        }
      `}
    >
      <Spacing bottom={2} />
      {uniqueChartDisclaimers.map(chartDisclaimer => (
        <React.Fragment key={chartDisclaimer}>
          <Text textLight>{parseCustomHtmlToReact(chartDisclaimer!)}</Text>
          <Spacing bottom={2} />
        </React.Fragment>
      ))}
    </Box>
  );
};

export default observer(ChartDisclaimer);
