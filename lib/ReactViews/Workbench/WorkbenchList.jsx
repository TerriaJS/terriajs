import React from "react";
import PropTypes from "prop-types";
import Sortable from "react-anything-sortable";

import WorkbenchItem from "./WorkbenchItem";
import { observer } from "mobx-react";
import { action } from "mobx";

import Styles from "./workbench-list.scss";
import "!!style-loader!css-loader?sourceMap!react-anything-sortable/sortable.css";
import "!!style-loader!css-loader?sourceMap!./sortable.css";

@observer
class WorkbenchList extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  };

  @action.bound
  onSort(sortedArray, currentDraggingSortData, currentDraggingIndex) {
    const draggedItemIndex = this.props.terria.workbench.items.indexOf(
      currentDraggingSortData
    );
    const addAtIndex = currentDraggingIndex;
    this.props.terria.workbench.items.splice(draggedItemIndex, 1);
    this.props.terria.workbench.items.splice(
      addAtIndex,
      0,
      currentDraggingSortData
    );
  }

  render() {
    return (
      <ul className={Styles.workbenchContent}>
        <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
          <For each="item" of={this.props.terria.workbench.items}>
            <WorkbenchItem
              item={item}
              sortData={item}
              key={item.id}
              viewState={this.props.viewState}
            />
          </For>
        </Sortable>
      </ul>
    );
  }
}

module.exports = WorkbenchList;
