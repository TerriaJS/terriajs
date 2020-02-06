import PropTypes from "prop-types";
import React from "react";
import { LegendOrdinal, LegendItem, LegendLabel } from "@vx/legend";
import { scaleOrdinal } from "@vx/scale";
import Styles from "./legends.scss";

export default class Legends extends React.PureComponent {
  static propTypes = {
    chartItems: PropTypes.array.isRequired
  };

  static maxHeightPx = 33;

  render() {
    const chartItems = this.props.chartItems;
    const colorScale = scaleOrdinal({
      domain: chartItems.map(c => `${c.categoryName} ${c.name}`),
      range: chartItems.map(c => c.getColor())
    });

    return (
      <div
        className={Styles.legends}
        style={{ maxHeight: `${Legends.maxHeightPx}px` }}
      >
        <LegendOrdinal scale={colorScale}>
          {labels => (
            <For each="label" of={labels}>
              <Legend key={`legend-${label.text}`} label={label} />
            </For>
          )}
        </LegendOrdinal>
      </div>
    );
  }
}

class Legend extends React.PureComponent {
  static propTypes = {
    label: PropTypes.object.isRequired
  };

  render() {
    const label = this.props.label;
    const squareSize = 15;
    return (
      <LegendItem margin="0 5px">
        <svg width={squareSize} height={squareSize}>
          <rect fill={label.value} width={squareSize} height={squareSize} />
        </svg>
        <LegendLabel className={Styles.label} align="left" margin="0 0 0 4px">
          {label.text}
        </LegendLabel>
      </LegendItem>
    );
  }
}
