"use strict";

import Chart from "../Custom/Chart/Chart";
import Description from "./Description";
import GroupPreview from "./GroupPreview";
import MappablePreview from "./MappablePreview";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./data-preview.scss";
import { observer } from "mobx-react";
import { runInAction } from "mobx";

/**
 * Data preview section, for the preview map see DataPreviewMap
 */
const DataPreview = observer(
  createReactClass({
    displayName: "DataPreview",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object,
      previewed: PropTypes.object
    },

    backToMap() {
      runInAction(() => {
        this.props.viewState.explorerPanelIsVisible = false;
      });
    },

    render() {
      let previewed = this.props.previewed;
      if (previewed !== undefined && previewed.dereferenced !== undefined) {
        previewed = previewed.dereferenced;
      }

      let chartData;
      if (previewed && !previewed.isMappable && previewed.tableStructure) {
        chartData = previewed.chartData();
      }
      return (
        <div className={Styles.preview}>
          <Choose>
            <When condition={previewed && previewed.isMappable}>
              <div className={Styles.previewInner}>
                <MappablePreview
                  previewed={previewed}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </When>
            <When condition={chartData}>
              <div className={Styles.previewInner}>
                <h3 className={Styles.h3}>{previewed.name}</h3>
                <p>This file does not contain geospatial data.</p>
                <div className={Styles.previewChart}>
                  <Chart
                    data={chartData}
                    axisLabel={{ x: previewed.xAxis.units, y: undefined }}
                    height={250 - 34}
                  />
                </div>
                <Description item={previewed} />
              </div>
            </When>
            {/* <When condition={previewed && typeof previewed.invoke !== 'undefined'}>
                        <InvokeFunction previewed={previewed}
                                        terria={this.props.terria}
                                        viewState={this.props.viewState}
                        />
                    </When> */}
            <When condition={previewed && previewed.isGroup}>
              <div className={Styles.previewInner}>
                <GroupPreview
                  previewed={previewed}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </When>
            <Otherwise>
              <div className={Styles.placeholder}>
                <p>Select a dataset to see a preview</p>
                <p>- OR -</p>
                <button
                  className={Styles.btnBackToMap}
                  onClick={this.backToMap}
                >
                  Go to the map
                </button>
              </div>
            </Otherwise>
          </Choose>
        </div>
      );
    }
  })
);

module.exports = DataPreview;
