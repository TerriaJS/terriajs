import uniq from "lodash/uniq";
import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLegend,
  VictoryLine,
  VictoryTheme
} from "victory";
import Chartable from "../../../Models/Chartable";

const minWidth = 110; // Required to prevent https://github.com/FormidableLabs/victory-native/issues/132

/**
 * A chart component that implements the charting behavior common to
 * FeatureInfoPanelChart & BottomDockChart. Presentation aspects are further
 * customized in the individual components.
 *
 */
@observer
class NewChart extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    items: PropTypes.array.isRequired,
    containerComponent: PropTypes.element,
    theme: PropTypes.object,
    renderLegends: PropTypes.func,
    renderXAxis: PropTypes.func,
    renderYAxis: PropTypes.func
  };

  static defaultProps = {
    height: 110,
    theme: VictoryTheme.material,
    renderXAxis: label => <VictoryAxis label={label} />,
    renderYAxis: (label, i) => (
      <VictoryAxis dependentAxis key={i} label={label} />
    ),
    renderLegends: (legends, width) => (
      <VictoryLegend x={width / 2} orientation="horizontal" data={legends} />
    )
  };

  @computed
  get chartData() {
    return this.props.items.reduce((p, c) => {
      if (Chartable.is(c)) {
        return p.concat(c.chartItems);
      }
      return p;
    }, []);
  }

  @computed
  get xAxis() {
    // TODO: Derive this from the chart items
    return { scale: "time", units: "Date" };
  }

  @computed
  get yAxes() {
    return uniq(
      this.chartData.map(data => ({
        units: data.units
      }))
    );
  }

  @computed
  get legends() {
    return this.chartData.map(({ name, color }) => {
      return { name, symbol: { fill: color } };
    });
  }

  @action
  loadChartItems(items) {
    items.forEach(item => {
      if (Chartable.is(item)) {
        item.loadChartItems();
      }
    });
  }

  renderData(data, index) {
    // TODO: render data based on data.type
    return (
      <VictoryLine name={`line:${data.name}`} key={index} data={data.points} />
    );
  }

  renderChart(width, height) {
    return (
      <VictoryChart
        width={width}
        height={height}
        theme={this.props.theme}
        scale={{ x: this.xAxis.scale }}
        containerComponent={this.props.containerComponent}
      >
        {this.props.renderLegends(this.legends, width)}
        {this.props.renderXAxis(this.xAxis.units)}
        <For each="yAxis" index="i" of={this.yAxes}>
          {this.props.renderYAxis(yAxis.units, i)}
        </For>
        <For each="data" index="i" of={this.chartData}>
          {this.renderData(data, i)}
        </For>
      </VictoryChart>
    );
  }

  render() {
    this.loadChartItems(this.props.items);
    return (
      <Sized>
        {({ width: parentWidth }) =>
          this.renderChart(
            Math.max(minWidth, this.props.width || parentWidth),
            this.props.height
          )
        }
      </Sized>
    );
  }
}

/**
 * A component that passes its width to its child component.
 */
@observer
class Sized extends React.Component {
  @observable containerElement = undefined;
  @observable width = 0;

  static propTypes = {
    children: PropTypes.func.isRequired
  };

  @action
  attachElement(el) {
    this.containerElement = el;
  }

  componentDidMount() {
    this.updateWidth();
    window.addEventListener("resize", this.updateWidth.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth.bind(this));
  }

  @action
  updateWidth() {
    if (this.containerElement) {
      this.width = this.containerElement.getBoundingClientRect().width;
    }
  }

  render() {
    return (
      <div ref={this.attachElement.bind(this)}>
        {this.props.children({ width: this.width })}
      </div>
    );
  }
}

export default NewChart;
