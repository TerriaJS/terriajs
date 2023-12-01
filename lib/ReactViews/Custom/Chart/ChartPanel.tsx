import { action } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ChartView from "../../../Charts/ChartView";
import Result from "../../../Core/Result";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Icon from "../../../Styled/Icon";
import { useViewState } from "../../Context";
import Loader from "../../Loader";
import Chart from "./BottomDockChart";
import { ChartPanelDownloadButton } from "./ChartPanelDownloadButton";
import Styles from "./chart-panel.scss";

const height = 300;

interface Props {
  onHeightChange?: () => void;
  animationDuration?: number;
}

function ChartPanel(props: Props) {
  const viewState = useViewState();
  const chartView = useMemo(
    () => new ChartView(viewState.terria),
    [viewState.terria]
  );
  const { t } = useTranslation();

  useEffect(() => {
    // Required so that components like the splitter that depend on screen
    // height will re-adjust.
    viewState.triggerResizeEvent();
    props.onHeightChange?.();
  }, []);

  useEffect(() => {
    // Repaint on every render
    viewState.terria.currentViewer.notifyRepaintRequired();
  });

  const closePanel = action(() => {
    chartView.chartItems.forEach((chartItem) => {
      chartItem.updateIsSelectedInWorkbench(false);
    });
  });

  const chartableCatalogItems = chartView.chartableItems;
  const chartItems = chartView.chartItems.filter((c) => c.showInChartPanel);

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
  const items = viewState.terria.workbench.items;
  if (items.length > 0) {
    // Load all items
    Promise.all(
      items.filter(MappableMixin.isMixedInto).map((item) => item.loadMapItems())
    ).then((results) =>
      Result.combine(results, {
        message: "Failed to load chart items",
        importance: -1
      }).raiseError(viewState.terria)
    );

    chart = (
      <Chart
        chartItems={chartItems}
        xAxis={chartView.xAxis!}
        height={height - 34}
      />
    );
  }

  return (
    <div className={Styles.holder}>
      <div className={Styles.inner}>
        <div className={Styles.chartPanel} style={{ height: height }}>
          <div>
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
                onClick={closePanel}
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

export default observer(ChartPanel);
