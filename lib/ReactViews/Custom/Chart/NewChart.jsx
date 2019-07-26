import PropTypes from "prop-types";
import React from "react";
import ChartRenderer from "../../../Charts/ChartRenderer";
import Styles from "./chart.scss";

export default class NewChart extends React.PureComponent {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    items: PropTypes.array.isRequired
  };

  _chartRenderer = undefined;

  attach(element) {
    if (element) {
      this._chartRenderer = new ChartRenderer(element, this.props);
    } else if (this._chartRenderer) {
      this.destroyChart();
    }
  }

  componentDidUpdate() {
    this._chartRenderer.props = this.props;
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  destroyChart() {
    this._chartRenderer.destroy();
    this._chartRenderer = undefined;
  }

  render() {
    return (
      <div className={Styles.chart}>
        <div className={Styles.chartInner} ref={this.attach.bind(this)} />
      </div>
    );
  }
}
