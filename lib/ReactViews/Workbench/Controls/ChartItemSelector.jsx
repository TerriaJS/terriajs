import Icon from "../../Icon";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Styles from "./chart-item-selector.scss";
import PropTypes from "prop-types";
import ChartView from "../../../Charts/ChartView";
import React from "react";
import Chartable, { axesMatch } from "../../../Models/Chartable";

const ChartItem = observer(({ item, chartItem }) => {
  const lineColor = chartItem.getColor();
  const colorStyle = lineColor && { color: lineColor };
  const fillStyle = lineColor && { fill: lineColor };

  const toggleActive = () => {
    const catalogItem = chartItem.item;
    runInAction(() => {
      const shouldSelect = !chartItem.isSelectedInWorkbench;
      chartItem.updateIsSelectedInWorkbench(shouldSelect);
      if (shouldSelect) {
        unselectChartItemsWithXAxisNotMatching(
          catalogItem.terria.workbench.items,
          chartItem.xAxis
        );
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleActive}
        style={colorStyle}
        className={Styles.button}
        title="select variable"
      >
        {chartItem.isSelectedInWorkbench && (
          <Icon style={fillStyle} glyph={Icon.GLYPHS.checkboxOn} />
        )}
        {!chartItem.isSelectedInWorkbench && (
          <Icon style={fillStyle} glyph={Icon.GLYPHS.checkboxOff} />
        )}
      </button>
      <span>{chartItem.name}</span>
    </div>
  );
});

const ChartItemSelector = observer(function({ item }) {
  const chartView = new ChartView(item.terria);
  const chartItems = chartView.chartItems.filter(c => c.item === item);
  return (
    <ul className={Styles.root}>
      <For each="chartItem" index="i" of={chartItems}>
        <li key={i} className={Styles.item}>
          <ChartItem chartItem={chartItem} />
        </li>
      </For>
    </ul>
  );
});

ChartItemSelector.propTypes = {
  item: PropTypes.object.isRequired
};

function unselectChartItemsWithXAxisNotMatching(items, requiredAxis) {
  items.forEach(item => {
    if (Chartable.is(item)) {
      item.chartItems.forEach(chartItem => {
        if (!axesMatch(chartItem.xAxis, requiredAxis)) {
          chartItem.updateIsSelectedInWorkbench(false);
        }
      });
    }
  });
}

export default ChartItemSelector;
