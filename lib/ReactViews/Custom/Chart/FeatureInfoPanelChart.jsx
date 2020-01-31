import { computed } from "mobx";
import { observer } from "mobx-react";
import { scaleLinear, scaleTime } from "@vx/scale";
import PropTypes from "prop-types";
import React from "react";
import Chartable from "../../../Models/Chartable";
import LineChart from "./LineChart";
import Sized from "./Sized";
import Styles from "./chart-preview.scss";

@observer
class FeatureInfoPanelChart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    item: PropTypes.object.isRequired,
    xAxisLabel: PropTypes.string,
    baseColor: PropTypes.string
  };

  static defaultProps = {
    baseColor: "#efefef"
  };

  @computed
  get chartItem() {
    return this.props.item.chartItems.find(
      chartItem => chartItem.type === "line"
    );
  }

  render() {
    if (!Chartable.is(this.props.item)) return null;
    console.log(this.props.item.chartItems);
    this.props.item.loadChartItems();
    if (!this.chartItem) return null;

    const { width, height } = this.props;
    return (
      <div className={Styles.previewChart}>
        <Sized>
          {parentSize => (
            <Chart
              width={width || parentSize.width}
              height={height || parentSize.height}
              chartItem={this.chartItem}
              baseColor={this.props.baseColor}
            />
          )}
        </Sized>
      </div>
    );
  }
}

class Chart extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    chartItem: PropTypes.object.isRequired,
    baseColor: PropTypes.string.isRequired
  };

  @computed
  get scales() {
    const chartItem = this.props.chartItem;
    const xScaleParams = {
      domain: chartItem.domain.x,
      range: [0, this.props.width]
    };
    const yScaleParams = {
      domain: chartItem.domain.y,
      range: [this.props.height, 0]
    };
    return {
      x:
        chartItem.xAxis.scale === "linear"
          ? scaleLinear(xScaleParams)
          : scaleTime(xScaleParams),
      y: scaleLinear(yScaleParams)
    };
  }

  render() {
    const { width, height, chartItem, baseColor } = this.props;
    const id = `featureInfoPanelChart-${chartItem.name}`;
    return (
      <svg width={width} height={height}>
        <LineChart
          id={id}
          chartItem={chartItem}
          scales={this.scales}
          color={baseColor}
        />
      </svg>
    );
  }
}

export default FeatureInfoPanelChart;
