"use strict";

import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
// @ts-expect-error TS(2691): An import path cannot end with a '.ts' extension. ... Remove this comment to see the full error message
import ChartView from "../../../Charts/ChartView.ts";
import Result from "../../../Core/Result";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Icon from "../../../Styled/Icon";
import Loader from "../../Loader";
import Chart from "./BottomDockChart";
import Styles from "./chart-panel.scss";
import { ChartPanelDownloadButton } from "./ChartPanelDownloadButton";

const height = 300;

@observer
class ChartPanel extends React.Component {
  static displayName = "ChartPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    onHeightChange: PropTypes.func,
    viewState: PropTypes.object.isRequired,
    animationDuration: PropTypes.number,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    makeObservable(this);
  }

  @computed
  get chartView() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    return new ChartView(this.props.terria);
  }

  closePanel() {
    this.chartView.chartItems.forEach((chartItem: any) => {
      chartItem.updateIsSelectedInWorkbench(false);
    });
  }

  componentDidUpdate() {
    // Required so that components like the splitter that depend on screen
    // height will re-adjust.
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.triggerResizeEvent();
    // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
    if (defined(this.props.onHeightChange)) {
      // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
      this.props.onHeightChange();
    }
  }

  render() {
    const chartableCatalogItems = this.chartView.chartableItems;
    const chartItems = this.chartView.chartItems.filter(
      (c: any) => c.showInChartPanel
    );
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.currentViewer.notifyRepaintRequired();
    if (chartItems.length === 0) {
      return null;
    }

    const isLoading = false;
    // const isLoading =
    //   chartableItems.length > 0 &&
    //   chartableItems[chartableItems.length - 1].isLoading;

    let loader;
    let chart;
    if (isLoading) {
      loader = <Loader className={Styles.loader} />;
    }
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const items = this.props.terria.workbench.items;
    if (items.length > 0) {
      // Load all items
      Promise.all(
        items
          .filter((item: any) => MappableMixin.isMixedInto(item))
          .map((item: any) => item.loadMapItems())
      ).then((results) =>
        Result.combine(results, {
          message: "Failed to load chart items",
          importance: -1
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        }).raiseError(this.props.terria)
      );

      chart = (
        <Chart
          // @ts-expect-error TS(2322): Type '{ terria: any; chartItems: any; xAxis: any; ... Remove this comment to see the full error message
          terria={this.props.terria}
          chartItems={chartItems}
          xAxis={this.chartView.xAxis}
          height={height - 34}
        />
      );
    }
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return (
      <div className={Styles.holder}>
        <div className={Styles.inner}>
          <div className={Styles.chartPanel} style={{ height: height }}>
            // @ts-expect-error TS(2339): Property 'body' does not exist on type
            'IChartPane... Remove this comment to see the full error message
            <div className={Styles.body}>
              <div className={Styles.header}>
                <label className={Styles.sectionLabel}>
                  {loader || t("chart.sectionLabel")}
                </label>
                <ChartPanelDownloadButton
                  chartableItems={chartableCatalogItems}
                />
                <button
                  type="button"
                  title={t("chart.closePanel")}
                  className={Styles.btnCloseChartPanel}
                  onClick={() => this.closePanel()}
                >
                  <Icon glyph={Icon.GLYPHS.close} />
                </button>
              </div>
              <div className={Styles.chart}>{chart}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(ChartPanel);
