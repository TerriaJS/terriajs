import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./chart-disclaimer.scss";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";

const ChartDisclaimer = createReactClass({
  displayName: "ChartDisclaimer",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  },

  render() {
    if (
      !this.props.viewState.chartIsOpen ||
      this.props.terria.catalog.chartableItems.length === 0
    )
      return null;
    const chartableItemsWithDisclaimers = this.props.terria.catalog.chartableItems.filter(
      item => item.chartDisclaimer && item.type !== "wms"
    );
    if (chartableItemsWithDisclaimers.length === 0) return null;
    const uniqueChartDisclaimers = [
      ...new Set(chartableItemsWithDisclaimers.map(i => i.chartDisclaimer))
    ];

    return (
      <div className={`${Styles.chartDisclaimerPanel}`}>
        {uniqueChartDisclaimers.map((chartDisclaimer, i) => (
          <p key={i}>{parseCustomHtmlToReact(chartDisclaimer)}</p>
        ))}
      </div>
    );
  }
});

export default ChartDisclaimer;
