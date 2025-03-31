//"use strict";

import { observer } from "mobx-react";
import { useState, useEffect, useRef } from "react";
import Icon from "../../../Styled/Icon";
import Chart from "./BottomDockChart";
import Styles from "./chart-panel.scss";
import { action } from "mobx";
import ViewState from "../../../ReactViewModels/ViewState";
import Terria from "../../../Models/Terria";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import MeasurablePanelManager from "../MeasurablePanelManager";

import i18next from "i18next";

enum ChartKeys {
  AirChart = "path",
  GroundChart = "path_sampled"
}

interface ChartPoint {
  x: number;
  y: number;
}

interface ChartItem {
  categoryName: string;
  name: string;
  units: string;
  key: string;
  type: string;
  glyphStyle: string;
  getColor: () => string;
  points: ChartPoint[];
  domain: { x: number[]; y: number[] };
}

interface Props {
  terria: Terria;
  viewState: ViewState;
}

const MeasurableGeometryChartPanel = observer((props: Props) => {
  const { terria, viewState } = props;
  const {
    measurableGeomList,
    measurableGeometryIndex,
    measurableGeomSamplingStep
  } = terria;
  const currentMeasurableGeometry = measurableGeomList[measurableGeometryIndex];

  const PANEL_HEIGHT = 300;
  const CHART_HEIGHT = 266;

  const [chartItems, setChartItems] = useState<ChartItem[]>();

  const chartPoint = useRef<ChartPoint>();

  MeasurablePanelManager.initialize(terria);

  const closePanel = action(() => {
    viewState.measurableChartIsVisible = false;
  });

  const fetchPathDataChart = (
    points: Cartographic[] | undefined,
    distances: number[] | undefined,
    totalDistance: number | undefined
  ) => {
    if (!points || !distances || !totalDistance) {
      return;
    }

    const pointsHeight = points.map((point) => point.height);

    const chartPoints = pointsHeight.map((height, i) => ({
      x: distances.map((v, j) => (j <= i ? v : 0)).reduce((a, b) => a + b, 0),
      y: height
    }));

    const chartDomain = {
      x: [0, totalDistance],
      y: [Math.min(...pointsHeight), Math.max(...pointsHeight)]
    };

    return { chartPoints, chartDomain };
  };

  const updateChartPointNearMouse = (newPoint: ChartPoint) => {
    if (
      newPoint &&
      terria?.cesium?.scene &&
      (!chartPoint?.current || chartPoint.current !== newPoint)
    ) {
      chartPoint.current = newPoint;
      const pointIndex = chartItems
        ?.find((item) => item.key === ChartKeys.GroundChart)
        ?.points.findIndex((elem) => elem === newPoint);
      if (!pointIndex) return;
      const coords =
        terria?.measurableGeomList[terria.measurableGeometryIndex]
          ?.sampledPoints?.[pointIndex];
      if (!coords) return;

      const airPointIndex = chartItems
        ?.find((item) => item.key === ChartKeys.AirChart)
        ?.points.findIndex(
          (elem) =>
            Math.abs(elem.x - newPoint.x) <=
            terria.measurableGeomSamplingStep + 5
        );
      viewState.setSelectedStopPointIdx(
        airPointIndex && airPointIndex !== -1 ? airPointIndex : null
      );

      MeasurablePanelManager.addMarker(coords);
    } else if (newPoint === undefined) {
      MeasurablePanelManager.removeAllMarkers();
      terria.currentViewer.notifyRepaintRequired();
    }
  };

  useEffect(() => {
    if (measurableGeomList && measurableGeomList[measurableGeometryIndex]) {
      const airData = fetchPathDataChart(
        measurableGeomList[measurableGeometryIndex].stopPoints,
        measurableGeomList[measurableGeometryIndex].stopAirDistances,
        measurableGeomList[measurableGeometryIndex].airDistance
      );
      const groundData = fetchPathDataChart(
        measurableGeomList[measurableGeometryIndex].sampledPoints,
        measurableGeomList[measurableGeometryIndex].sampledDistances,
        measurableGeomList[measurableGeometryIndex].groundDistance
      );

      const items: ChartItem[] = [];

      if (groundData?.chartPoints && groundData.chartDomain) {
        items.push({
          categoryName: i18next.t("elevationChart.measure"),
          name: i18next.t("elevationChart.measureGround"),
          units: "m",
          key: ChartKeys.GroundChart,
          type: "lineAndPoint",
          glyphStyle: "circle",
          getColor: () => "#0f0",
          points: groundData?.chartPoints,
          domain: groundData?.chartDomain
        });
      }
      if (airData?.chartPoints && airData.chartDomain) {
        items.push({
          categoryName: i18next.t("elevationChart.measure"),
          name: i18next.t("elevationChart.measureAir"),
          units: "m",
          key: ChartKeys.AirChart,
          type: "lineAndPoint",
          glyphStyle: "circle",
          getColor: () => "#f00",
          points: airData?.chartPoints,
          domain: airData?.chartDomain
        });
      }

      setChartItems(items);
    }
  }, [
    measurableGeometryIndex,
    measurableGeomList,
    measurableGeomSamplingStep,
    currentMeasurableGeometry
  ]);

  return (
    <div className={Styles.holder}>
      <div className={Styles.inner}>
        <div className={Styles.chartPanel} style={{ height: PANEL_HEIGHT }}>
          <div className={Styles.header}>
            <label className={Styles.sectionLabel}>
              {i18next.t("elevationChart.header")}
            </label>
            <button
              type="button"
              className={Styles.btnCloseChartPanel}
              onClick={closePanel}
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
          </div>
          <div className={Styles.chart}>
            {chartItems && (
              <Chart
                terria={terria}
                chartItems={chartItems}
                xAxis={{
                  scale: "linear",
                  units: "m"
                }}
                height={CHART_HEIGHT}
                chartItemKeyForPointMouseNear={ChartKeys}
                onPointMouseNear={updateChartPointNearMouse}
                selectedStopPointIdx={viewState.selectedStopPointIdx}
                selectedSampledPointIdx={viewState.selectedSampledPointIdx}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MeasurableGeometryChartPanel;
