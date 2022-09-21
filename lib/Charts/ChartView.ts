import { computed } from "mobx";
import ChartableMixin, {
  axesMatch,
  ChartItem
} from "../ModelMixins/ChartableMixin";
import Terria from "../Models/Terria";

/**
 * Derives a consistent view of chart data from all the chartable items in the
 * workbench.
 */
export default class ChartView {
  constructor(readonly terria: Terria) {}

  @computed
  get chartableItems(): ChartableMixin.Instance[] {
    return <any>(
      this.terria.workbench.items.filter(
        (item) => ChartableMixin.isMixedInto(item) && item.chartItems.length > 0
      )
    );
  }

  /**
   * Returns the common x-axis for the chart.
   */
  @computed
  get xAxis() {
    // We just return the xAxis of the first chartItem selected in the workbench.
    for (let i = 0; i < this.chartableItems.length; i++) {
      for (let j = 0; j < this.chartableItems[i].chartItems.length; j++) {
        const chartItem = this.chartableItems[i].chartItems[j];
        if (chartItem.isSelectedInWorkbench && chartItem.showInChartPanel) {
          return chartItem.xAxis;
        }
      }
    }
    return undefined;
  }

  /**
   * Returns chartItems for all chartable items in the workbench.
   *
   * Sets flags for how the chart items are displayed in the workbench and
   * in the chart panel.
   */
  @computed
  get chartItems(): ChartItem[] {
    return this.chartableItems.reduce((acc: ChartItem[], item) => {
      return acc.concat(
        item.chartItems.map((chartItem) => {
          if (this.xAxis && !axesMatch(this.xAxis, chartItem.xAxis)) {
            chartItem = {
              ...chartItem,
              isSelectedInWorkbench: false,
              showInChartPanel: false
            };
          }
          return chartItem;
        })
      );
    }, []);
  }
}
