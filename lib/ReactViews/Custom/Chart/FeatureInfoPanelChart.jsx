import { AxisBottom, AxisLeft } from "@vx/axis";
import { Group } from "@vx/group";
import { withParentSize } from "@vx/responsive";
import { scaleLinear, scaleTime } from "@vx/scale";
import { computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import Styles from "./chart-preview.scss";
import LineChart from "./LineChart";

@withParentSize
@observer
class FeatureInfoPanelChart extends React.Component {
  static propTypes = {
    parentWidth: PropTypes.number,
    parentHeight: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number.isRequired,
    margin: PropTypes.object,
    item: PropTypes.object.isRequired,
    xAxisLabel: PropTypes.string,
    baseColor: PropTypes.string
  };

  static defaultProps = {
    parentWidth: 0,
    parentHeight: 0,
    baseColor: "#efefef",
    margin: { top: 5, left: 5, right: 5, bottom: 5 }
  };

  @computed
  get chartItem() {
    return this.props.item.chartItems.find(
      chartItem =>
        chartItem.type === "line" || chartItem.type === "lineAndPoint"
    );
  }

  async componentDidUpdate() {
    (await this.props.item.loadMapItems()).raiseError(
      this.props.item.terria,
      `Failed to load chart for ${this.props.item.name}`
    );
  }

  async componentDidMount() {
    (await this.props.item.loadMapItems()).raiseError(
      this.props.item.terria,
      `Failed to load chart for ${this.props.item.name}`
    );
  }

  render() {
    if (!ChartableMixin.isMixedInto(this.props.item)) return null;
    if (!this.chartItem) return null;

    const { width, height, parentWidth, parentHeight } = this.props;
    return (
      <div className={Styles.previewChart}>
        <Chart
          width={width || parentWidth}
          height={height || parentHeight}
          margin={this.props.margin}
          chartItem={this.chartItem}
          baseColor={this.props.baseColor}
          xAxisLabel={this.props.xAxisLabel}
        />
      </div>
    );
  }
}

@observer
class Chart extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margin: PropTypes.object.isRequired,
    chartItem: PropTypes.object.isRequired,
    baseColor: PropTypes.string.isRequired,
    xAxisLabel: PropTypes.string
  };

  xAxisHeight = 30;
  yAxisWidth = 10;

  @computed
  get plot() {
    const { width, height, margin } = this.props;
    return {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom - this.xAxisHeight
    };
  }

  @computed
  get scales() {
    const chartItem = this.props.chartItem;
    const xScaleParams = {
      domain: chartItem.domain.x,
      range: [this.props.margin.left + this.yAxisWidth, this.plot.width]
    };
    const yScaleParams = {
      domain: chartItem.domain.y,
      range: [this.plot.height, 0]
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
    const { height, margin, chartItem, baseColor } = this.props;

    if (chartItem.points.length === 0) {
      return <div className={Styles.empty}>No data available</div>;
    }

    // Make sure points are asc sorted by x value
    chartItem.points = chartItem.points.sort(
      (a, b) => this.scales.x(a.x) - this.scales.x(b.x)
    );

    const id = `featureInfoPanelChart-${chartItem.name}`;
    const textStyle = {
      fill: baseColor,
      fontSize: 10,
      textAnchor: "middle",
      fontFamily: "Arial"
    };
    return (
      <svg width="100%" height={height}>
        <Group top={margin.top} left={margin.left}>
          <AxisBottom
            top={this.plot.height}
            scale={this.scales.x}
            numTicks={2}
            stroke="none"
            tickStroke="none"
            tickLabelProps={() => ({
              ...textStyle,
              // nudge the tick label a bit to the left so that we can fit
              // values up to 8 chars long without getting clipped
              dx: "-2em"
            })}
            label={this.props.xAxisLabel}
            labelOffset={3}
            labelProps={textStyle}
          />
          <AxisLeft
            scale={this.scales.y}
            numTicks={4}
            stroke="none"
            tickStroke="none"
            label={chartItem.units}
            labelOffset={24}
            labelProps={textStyle}
            tickLabelProps={() => ({
              ...textStyle,
              textAnchor: "start",
              dx: "0.5em",
              dy: "0.25em"
            })}
          />
          <LineChart
            id={id}
            chartItem={chartItem}
            scales={this.scales}
            color={baseColor}
          />
        </Group>
      </svg>
    );
  }
}

export default FeatureInfoPanelChart;
