"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { sortable } from "react-anything-sortable";
import defined from "terriajs-cesium/Source/Core/defined";
import CommonStrata from "../../Models/CommonStrata";
import getAncestors from "../../Models/getAncestors";
import Icon from "../Icon";
import ChartItemSelector from "./Controls/ChartItemSelector";
import ColorScaleRangeSection from "./Controls/ColorScaleRangeSection";
import ConceptViewer from "./Controls/ConceptViewer";
import DateTimeSelectorSection from "./Controls/DateTimeSelectorSection";
import DimensionSelectorSection from "./Controls/DimensionSelectorSection";
import DisplayAsPercentSection from "./Controls/DisplayAsPercentSection";
import FilterSection from "./Controls/FilterSection";
import LeftRightSection from "./Controls/LeftRightSection";
import Legend from "./Controls/Legend";
import OpacitySection from "./Controls/OpacitySection";
import SatelliteImageryTimeFilterSection from "./Controls/SatelliteImageryTimeFilterSection";
import ShadowSection from "./Controls/ShadowSection";
import ShortReport from "./Controls/ShortReport";
import StyleSelectorSection from "./Controls/StyleSelectorSection";
import TimerSection from "./Controls/TimerSection";
import ViewingControls from "./Controls/ViewingControls";
import Styles from "./workbench-item.scss";
import { runInAction } from "mobx";

const WorkbenchItem = observer(
  createReactClass({
    displayName: "WorkbenchItem",

    propTypes: {
      style: PropTypes.object,
      className: PropTypes.string,
      onMouseDown: PropTypes.func.isRequired,
      onTouchStart: PropTypes.func.isRequired,
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      setWrapperState: PropTypes.func
    },

    toggleDisplay() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "isOpenInWorkbench",
          !this.props.item.isOpenInWorkbench
        );
      });
    },

    openModal() {
      this.props.setWrapperState({
        modalWindowIsOpen: true,
        activeTab: 1,
        previewed: this.props.item
      });
    },

    toggleVisibility() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "show",
          !this.props.item.show
        );
      });
    },

    render() {
      const workbenchItem = this.props.item;
      return (
        <li
          style={this.props.style}
          className={classNames(this.props.className, Styles.workbenchItem, {
            [Styles.isOpen]: workbenchItem.isOpenInWorkbench
          })}
        >
          <ul className={Styles.header}>
            <If condition={true || workbenchItem.supportsToggleShown}>
              <li className={Styles.visibilityColumn}>
                <button
                  type="button"
                  onClick={this.toggleVisibility}
                  title="Data show/hide"
                  className={Styles.btnVisibility}
                >
                  {workbenchItem.show ? (
                    <Icon glyph={Icon.GLYPHS.checkboxOn} />
                  ) : (
                    <Icon glyph={Icon.GLYPHS.checkboxOff} />
                  )}
                </button>
              </li>
            </If>
            <li className={Styles.nameColumn}>
              <div
                onMouseDown={this.props.onMouseDown}
                onTouchStart={this.props.onTouchStart}
                className={Styles.draggable}
                title={getAncestors(workbenchItem)
                  .map(member => member.nameInCatalog)
                  .concat(workbenchItem.nameInCatalog)
                  .join(" → ")}
              >
                <If condition={!workbenchItem.isMappable}>
                  <span className={Styles.iconLineChart}>
                    <Icon glyph={Icon.GLYPHS.lineChart} />
                  </span>
                </If>
                {workbenchItem.name}
              </div>
            </li>
            <li className={Styles.toggleColumn}>
              <button
                type="button"
                className={Styles.btnToggle}
                onClick={this.toggleDisplay}
              >
                {workbenchItem.isOpenInWorkbench ? (
                  <Icon glyph={Icon.GLYPHS.opened} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.closed} />
                )}
              </button>
            </li>
            <li className={Styles.headerClearfix} />
          </ul>

          <If condition={workbenchItem.isOpenInWorkbench}>
            <div className={Styles.inner}>
              <ViewingControls
                item={workbenchItem}
                viewState={this.props.viewState}
              />
              <OpacitySection item={workbenchItem} />
              <LeftRightSection item={workbenchItem} />
              <TimerSection item={workbenchItem} />
              <If
                condition={
                  defined(workbenchItem.concepts) &&
                  workbenchItem.concepts.length > 0 &&
                  workbenchItem.displayChoicesBeforeLegend
                }
              >
                <ConceptViewer item={workbenchItem} />
              </If>
              <ChartItemSelector item={workbenchItem} />
              <FilterSection item={workbenchItem} />
              <ShadowSection item={workbenchItem} />
              <DimensionSelectorSection item={workbenchItem} />
              <DateTimeSelectorSection item={workbenchItem} />
              <SatelliteImageryTimeFilterSection item={workbenchItem} />
              <StyleSelectorSection item={workbenchItem} />
              <ColorScaleRangeSection
                item={workbenchItem}
                minValue={workbenchItem.colorScaleMinimum}
                maxValue={workbenchItem.colorScaleMaximum}
              />
              <DisplayAsPercentSection item={workbenchItem} />
              <Legend item={workbenchItem} />
              <If
                condition={
                  defined(workbenchItem.concepts) &&
                  workbenchItem.concepts.length > 0 &&
                  !workbenchItem.displayChoicesBeforeLegend
                }
              >
                <ConceptViewer item={workbenchItem} />
              </If>
              <If
                condition={
                  workbenchItem.shortReport ||
                  (workbenchItem.shortReportSections &&
                    workbenchItem.shortReportSections.length)
                }
              >
                <ShortReport item={workbenchItem} />
              </If>
            </div>
          </If>
        </li>
      );
    }
  })
);

module.exports = sortable(WorkbenchItem);
