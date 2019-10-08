import merge from "lodash/merge";
import { computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { VictoryAxis, VictoryTheme } from "victory";
import Chart from "./NewChart";

@observer
class FeatureInfoPanelChart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    items: PropTypes.array.isRequired,
    xAxisLabel: PropTypes.string
  };

  @computed
  get theme() {
    const fontSize = 10;
    const textColor = "white";
    return merge({}, VictoryTheme.grayscale, {
      chart: { padding: { top: 15, bottom: 30, left: 50, right: 0 } },
      axis: {
        style: {
          axis: { stroke: "none" } // hides all axis lines
        }
      },
      independentAxis: {
        style: {
          axisLabel: { fontSize, padding: 15, fill: textColor },
          tickLabels: { fontSize: 0, padding: 0 }
        }
      },
      dependentAxis: {
        style: {
          tickLabels: { fontSize, fill: textColor }
        }
      },
      line: {
        style: {
          data: { stroke: "white" }
        }
      }
    });
  }

  renderXAxis() {
    return <VictoryAxis label={this.props.xAxisLabel} />;
  }

  renderYAxis(label, index) {
    return <VictoryAxis dependentAxis key={index} tickCount={2} />;
  }

  render() {
    return (
      <Chart
        width={this.props.width}
        height={this.props.height}
        theme={this.theme}
        items={this.props.items}
        renderLegends={() => null}
        renderYAxis={this.renderYAxis.bind(this)}
        renderXAxis={this.renderXAxis.bind(this)}
      />
    );
  }
}

export default FeatureInfoPanelChart;
