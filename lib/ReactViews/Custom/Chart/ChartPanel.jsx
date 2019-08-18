"use strict";

import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";
import Chart from "./NewChart";
// import ChartPanelDownloadButton from "./ChartPanelDownloadButton";
import Loader from "../../Loader";
import Icon from "../../Icon";
import Styles from "./chart-panel.scss";
import { observer } from "mobx-react";
import raiseErrorOnRejectedPromise from "../../../Models/raiseErrorOnRejectedPromise";
import Chartable from "../../../Models/Chartable";
import { runInAction } from "mobx";
import CommonStrata from "../../../Models/CommonStrata";

const height = 300;

const ChartPanel = observer(
  createReactClass({
    displayName: "ChartPanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      onHeightChange: PropTypes.func,
      viewState: PropTypes.object.isRequired,
      animationDuration: PropTypes.number
    },

    hasItemsToChart() {
      const workbench = this.props.terria.workbench;
      const chartItems = workbench.items
        .filter(Chartable.is)
        .flatMap(c => c.chartItems);
      return chartItems.length > 0;
    },

    closePanel() {
      const workbench = this.props.terria.workbench;
      const chartableItems = workbench.items
        .filter(Chartable.is)
        .filter(c => c.chartItems.length > 0);
      chartableItems.forEach(c =>
        runInAction(() => {
          c.setTrait(CommonStrata.user, "show", false);
        })
      );
    },

    componentDidUpdate() {
      if (defined(this.props.onHeightChange)) {
        this.props.onHeightChange();
      }
    },

    render() {
      if (!this.hasItemsToChart()) {
        return null;
      }

      // const chartableItems = this.props.terria.catalog.chartableItems;
      // if (this.props.viewState.chartIsOpen === false) {
      //   return null;
      // }
      const data = [];
      let xUnits;
      // chartableItems.forEach(item => {
      //   const thisData = item.chartData();
      //   if (!defined(thisData)) {
      //     return;
      //   }
      //   if (item.isEnabled) {
      //     data = data.concat(thisData);

      //     if (!defined(xUnits) && defined(item.xAxis)) {
      //       xUnits = item.xAxis.units;
      //     }
      //   }
      // });

      const isLoading = false;
      // const isLoading =
      //   chartableItems.length > 0 &&
      //   chartableItems[chartableItems.length - 1].isLoading;

      // this.props.terria.currentViewer.notifyRepaintRequired();

      let loader;
      let chart;
      if (isLoading) {
        loader = <Loader className={Styles.loader} />;
      }
      const items = this.props.terria.workbench.items;
      if (data.length > 0 || items.length > 0) {
        const loadPromises = items.map(item => item.loadMapItems());
        raiseErrorOnRejectedPromise(
          this.props.terria,
          Promise.all(loadPromises)
        );

        chart = (
          <Chart
            items={this.props.terria.workbench.items}
            // data={data}
            axisLabel={{ x: xUnits, y: undefined }}
            height={height - 34}
          />
        );
      }
      return (
        <div className={Styles.holder}>
          <div className={Styles.inner}>
            <div className={Styles.chartPanel} style={{ height: height }}>
              <div className={Styles.body}>
                <div className={Styles.header}>
                  <label className={Styles.sectionLabel}>
                    {loader || "Charts"}
                  </label>
                  {/* <ChartPanelDownloadButton
                    chartableItems={this.props.terria.catalog.chartableItems}
                  /> */}
                  <button
                    type="button"
                    title="Close Panel"
                    className={Styles.btnCloseChartPanel}
                    onClick={this.closePanel}
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
  })
);

module.exports = ChartPanel;
