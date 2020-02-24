"use strict";

import classNames from "classnames";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { sortable } from "react-anything-sortable";

import defined from "terriajs-cesium/Source/Core/defined";

import ConceptViewer from "./Controls/ConceptViewer";
import DateTimeSelectorSection from "./Controls/DateTimeSelectorSection";
import SatelliteImageryTimeFilterSection from "./Controls/SatelliteImageryTimeFilterSection";
import DimensionSelectorSection from "./Controls/DimensionSelectorSection";
import DisplayAsPercentSection from "./Controls/DisplayAsPercentSection";
import getAncestors from "../../Models/getAncestors";
import LeftRightSection from "./Controls/LeftRightSection";
import Legend from "./Controls/Legend";
import ObserveModelMixin from "./../ObserveModelMixin";
import OpacitySection from "./Controls/OpacitySection";
import ColorScaleRangeSection from "./Controls/ColorScaleRangeSection";
import ShortReport from "./Controls/ShortReport";
import StyleSelectorSection from "./Controls/StyleSelectorSection";
import ViewingControls from "./Controls/ViewingControls";
import TimerSection from "./Controls/TimerSection";
import { withTranslation } from "react-i18next";

import Styles from "./workbench-item.scss";
import Icon from "../Icon.jsx";

export const WorkbenchItemRaw = createReactClass({
  displayName: "WorkbenchItem",
  mixins: [ObserveModelMixin],

  propTypes: {
    style: PropTypes.object,
    className: PropTypes.string,
    onMouseDown: PropTypes.func.isRequired,
    onTouchStart: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    setWrapperState: PropTypes.func,
    t: PropTypes.func.isRequired
  },

  toggleDisplay() {
    this.props.item.isLegendVisible = !this.props.item.isLegendVisible;
  },

  openModal() {
    this.props.setWrapperState({
      modalWindowIsOpen: true,
      activeTab: 1,
      previewed: this.props.item
    });
  },

  toggleVisibility() {
    this.props.item.isShown = !this.props.item.isShown;
  },

  render() {
    const workbenchItem = this.props.item;
    const { t } = this.props;
    return (
      <li
        style={this.props.style}
        className={classNames(this.props.className, Styles.workbenchItem, {
          [Styles.isOpen]: workbenchItem.isLegendVisible
        })}
      >
        <ul className={Styles.header}>
          <If condition={workbenchItem.supportsToggleShown}>
            <li className={Styles.visibilityColumn}>
              <button
                type="button"
                onClick={this.toggleVisibility}
                title={t("workbench.toggleVisibility")}
                className={Styles.btnVisibility}
              >
                {workbenchItem.isShown ? (
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
              {workbenchItem.isLegendVisible ? (
                <Icon glyph={Icon.GLYPHS.opened} />
              ) : (
                <Icon glyph={Icon.GLYPHS.closed} />
              )}
            </button>
          </li>
          <li className={Styles.headerClearfix} />
        </ul>

        <If condition={workbenchItem.isLegendVisible}>
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
            <If
              condition={
                workbenchItem.shortReport ||
                (workbenchItem.shortReportSections &&
                  workbenchItem.shortReportSections.length)
              }
            >
              <ShortReport item={workbenchItem} />
            </If>
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
          </div>
        </If>
      </li>
    );
  }
});

export default sortable(withTranslation()(WorkbenchItemRaw));
