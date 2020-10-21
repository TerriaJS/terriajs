"use strict";

import classNames from "classnames";
import React from "react";

import PropTypes from "prop-types";
import createReactClass from "create-react-class";

import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import clone from "terriajs-cesium/Source/Core/clone";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";

import GeoJsonCatalogItem from "../../../Models/GeoJsonCatalogItem";
import CompositeCatalogItem from "../../../Models/CompositeCatalogItem";
import CsvCatalogItem from "../../../Models/CsvCatalogItem";
import SensorObservationServiceCatalogItem from "../../../Models/SensorObservationServiceCatalogItem";
import Dropdown from "../../Generic/Dropdown";
import Polling from "../../../Models/Polling";
import raiseErrorToUser from "../../../Models/raiseErrorToUser";
import TableStyle from "../../../Models/TableStyle";
import Icon from "../../Icon.jsx";
import { withTranslation } from "react-i18next";

import Styles from "./chart-expand-and-download-buttons.scss";

// This displays both an "expand" button, which enables a new catalog item based on the chart data,
// and a "download" button, which downloads the data.
//
const ChartExpandAndDownloadButtons = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    // Either provide URLs to the expanded data.
    sources: PropTypes.array,
    sourceNames: PropTypes.array,
    downloads: PropTypes.array,
    downloadNames: PropTypes.array,
    // Optional polling info that would need to be transferred to any standalone catalog item.
    pollSources: PropTypes.array,
    pollSeconds: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pollReplace: PropTypes.bool,
    updateCounter: PropTypes.any, // Change this to trigger an update.
    // Or, provide a tableStructure directly.
    tableStructure: PropTypes.object,
    //
    catalogItem: PropTypes.object,
    title: PropTypes.string,
    colors: PropTypes.array,
    feature: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    columnNames: PropTypes.array,
    columnUnits: PropTypes.array,
    xColumn: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    yColumns: PropTypes.array,
    canDownload: PropTypes.bool,
    raiseToTitle: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  expandButton() {
    if (defined(this.props.sources)) {
      expand(this.props, this.props.sources.length - 1);
    } else {
      expand(this.props); // Will expand from this.props.tableStructure.
    }
  },

  expandDropdown(selected, sourceIndex) {
    expand(this.props, sourceIndex);
  },

  render() {
    if (!defined(this.props.sources) && !defined(this.props.tableStructure)) {
      return null;
    }

    // The downloads and download names default to the sources and source names if not defined.
    const downloads = this.props.downloads || this.props.sources;
    const downloadNames = this.props.downloadNames || this.props.sourceNames;
    let downloadButton;
    const { t } = this.props;
    if (defined(this.props.sourceNames)) {
      const dropdownTheme = {
        dropdown: Styles.dropdown,
        list: Styles.dropdownList,
        button: Styles.dropdownBtn,
        btnOption: Styles.dropdownBtnOption
      };

      const sourceNameObjects = this.props.sourceNames.map(name => {
        return { name: name };
      });
      const nameAndHrefObjects = downloadNames.map((name, i) => {
        return { name: name, href: downloads[i] };
      });
      if (this.props.canDownload) {
        const downloadDropdownTheme = clone(dropdownTheme);
        downloadDropdownTheme.button = classNames(
          Styles.btnSmall,
          Styles.btnDownload
        );
        downloadButton = (
          <Dropdown
            selectOption={this.downloadDropdown}
            options={nameAndHrefObjects}
            theme={downloadDropdownTheme}
          >
            {t("chart.download") + " ▾"}
          </Dropdown>
        );
      }

      return (
        <div
          className={classNames(Styles.chartExpand, {
            [Styles.raiseToTitle]: this.props.raiseToTitle
          })}
        >
          <div className={Styles.chartDropdownButton}>
            <Dropdown
              selectOption={this.expandDropdown}
              options={sourceNameObjects}
              theme={dropdownTheme}
            >
              {t("chart.expand") + " ▾"}
            </Dropdown>
            {downloadButton}
          </div>
        </div>
      );
    }
    if (this.props.canDownload && defined(downloads)) {
      const href = downloads[0];
      downloadButton = (
        <a
          className={classNames(Styles.btnSmall, Styles.aDownload)}
          href={href}
        >
          <Icon glyph={Icon.GLYPHS.download} />
        </a>
      );
    }
    return (
      <div className={Styles.chartExpand}>
        <button
          type="button"
          className={Styles.btnChartExpand}
          onClick={this.expandButton}
        >
          {t("chart.expand")}
        </button>
        {downloadButton}
      </div>
    );
  }
});

/**
 * Reads chart data from a URL or tableStructure into a CsvCatalogItem, which shows it in the bottom dock.
 * @private
 */
function expand(props, sourceIndex) {
  const feature = props.feature;
  function makeTableStyle() {
    // Set the table style so that the names and units of the columns appear immediately, not with a delay.
    const tableStyleOptions = {
      columns: {}
    };
    const maxColumnNamesAndUnits = Math.max(
      (props.columnNames || []).length,
      (props.columnUnits || []).length
    );
    for (
      let columnNumber = 0;
      columnNumber < maxColumnNamesAndUnits;
      columnNumber++
    ) {
      tableStyleOptions.columns[columnNumber] = {};
      if (defined(props.columnNames) && props.columnNames[columnNumber]) {
        tableStyleOptions.columns[columnNumber].name =
          props.columnNames[columnNumber];
      }
      if (defined(props.columnUnits) && props.columnUnits[columnNumber]) {
        tableStyleOptions.columns[columnNumber].units =
          props.columnUnits[columnNumber];
      }
    }
    // Set the active columns via tableStyle too.
    // This is a bit inconsistent with the above, since above we index with column number
    // and here we may be indexing with number or id or name.
    // But it works. (TableStyle.columns may have multiple references to the same column.)
    if (defined(props.xColumn)) {
      tableStyleOptions.xAxis = props.xColumn;
    }
    if (defined(props.yColumns)) {
      props.yColumns.forEach(nameOrIndex => {
        tableStyleOptions.columns[nameOrIndex] = defaultValue(
          tableStyleOptions.columns[nameOrIndex],
          {}
        );
        tableStyleOptions.columns[nameOrIndex].active = true;
      });
    }
    return new TableStyle(tableStyleOptions);
  }

  // Create a new CSV catalog item from the data source details we have
  // Side-effect: sets activeConcepts and existingColors
  function makeNewCatalogItem() {
    const url = defined(sourceIndex) ? props.sources[sourceIndex] : undefined;

    const newCatalogItem = new CsvCatalogItem(terria, url, {
      tableStyle: makeTableStyle(),
      isCsvForCharting: true,
      chartDisclaimer: props.catalogItem.chartDisclaimer
        ? props.catalogItem.chartDisclaimer
        : null
    });
    const items = [newCatalogItem];
    let newGeoJsonAvailable = false;
    if (defined(feature.position) && defined(feature.position._value)) {
      newGeoJsonAvailable = true;
      const newGeoJsonItem = new GeoJsonCatalogItem(terria, null);
      newGeoJsonItem.isUserSupplied = true;
      newGeoJsonItem.style = {
        "stroke-width": 3,
        "marker-size": 30,
        stroke: "#ffffff",
        "marker-color": newCatalogItem.colors[0],
        "marker-opacity": 1
      };
      const carts = Ellipsoid.WGS84.cartesianToCartographic(
        feature.position._value
      );
      newGeoJsonItem.data = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [
            CesiumMath.toDegrees(carts.longitude),
            CesiumMath.toDegrees(carts.latitude)
          ]
        }
      };
      newGeoJsonItem.isMappable = true;
      items.push(newGeoJsonItem);
    }

    const compositeItem = new CompositeCatalogItem(terria, items);

    let tableStructure = props.tableStructure;
    if (
      defined(props.colors) &&
      props.colors.length >= tableStructure.columns.length
    ) {
      newCatalogItem.getNextColor = index => props.colors[index];
    }

    // For CSV data with a URL, we could just use the usual csvCatalogItem._load to load this from the url.
    // However, we also want this to work with urls that may be interpreted differently according to CatalogItem.loadIntoTableStructure.
    // So use the parent catalogItem's loadIntoTableStructure (if available) to do the load.
    // Note that CsvCatalogItem's _load function checks for data first, and only loads the URL if no data is present, so we won't double up.
    if (
      !defined(tableStructure) &&
      defined(props.catalogItem) &&
      defined(props.catalogItem.loadIntoTableStructure)
    ) {
      tableStructure = props.catalogItem.loadIntoTableStructure(url);
      // At least for SensorObservationServiceCatalogItems, store a reference to that item, on the chart item being generated
      if (props.catalogItem.type === "sos") {
        // debugger
        newCatalogItem.sourceCatalogItemId = props.catalogItem.uniqueId;
        if (
          props.catalogItem.activeConcepts &&
          props.catalogItem.activeConcepts.length === 1
        ) {
          const procedure = SensorObservationServiceCatalogItem.getObjectCorrespondingToSelectedConcept(
            props.catalogItem,
            "procedures"
          );
          newCatalogItem.regenerationOptions = {
            procedure: procedure
          };
        }
      }
    }
    newCatalogItem.data = tableStructure;
    // Without this, if the chart data comes via the proxy, it would be cached for the default period of 2 weeks.
    // So, retain the same `cacheDuration` as the parent data file.
    // You can override this with the `pollSeconds` attribute (coming!).
    // If neither is set, it should default to a small duration rather than 2 weeks - say 1 minute.
    newCatalogItem.cacheDuration = defaultValue(
      props.catalogItem.cacheDuration,
      "1m"
    );
    newCatalogItem.name =
      props.title || (props.feature && props.feature.name) || "Chart";
    const group = terria.catalog.chartDataGroup;
    newCatalogItem.id = group.uniqueId + "/" + newCatalogItem.name;

    if (defined(props.pollSeconds)) {
      const pollSources = props.pollSources;
      newCatalogItem.polling = new Polling({
        seconds: props.pollSeconds,
        url:
          defined(sourceIndex) && defined(pollSources)
            ? pollSources[Math.min(sourceIndex, pollSources.length - 1)]
            : undefined,
        replace: props.pollReplace
      });
    }
    group.isOpen = true;
    const existingIndex = group.items
      .map(item => item.uniqueId)
      .indexOf(newCatalogItem.uniqueId);
    if (existingIndex >= 0) {
      // First, keep a copy of the active items and colors used, so we can keep them the same with the new chart.
      const oldCatalogItem = group.items[existingIndex];
      if (
        defined(oldCatalogItem.tableStructure) &&
        defined(oldCatalogItem.tableStructure.columns)
      ) {
        activeConcepts = oldCatalogItem.tableStructure.columns.map(
          column => column.isActive
        );
        existingColors = oldCatalogItem.tableStructure.columns.map(
          column => column.color
        );
      } else {
        activeConcepts = undefined;
        existingColors = undefined;
      }
      oldCatalogItem.isEnabled = false;
      group.remove(oldCatalogItem);
    }
    group.add(newCatalogItem);

    newCatalogItem.isLoading = true;
    newCatalogItem.isMappable = false;
    newCatalogItem.isEnabled = true;
    newCatalogItem.creatorCatalogItem = compositeItem;
    if (newGeoJsonAvailable)
      items[1].style["marker-color"] = newCatalogItem.getNextColor();

    terria.catalog.addChartableItem(newCatalogItem); // Notify the chart panel so it shows "loading".

    compositeItem.isEnabled = true;
    compositeItem.nowViewingCatalogItem = newCatalogItem;

    return compositeItem;
  }

  let existingColors;
  let activeConcepts;
  const terria = props.terria;
  const newCatalogItem = makeNewCatalogItem();
  // Is there a better way to set up an action to occur once the file has loaded?
  newCatalogItem.load().then(() => {
    // Enclose in try-catch rather than otherwise so that if load itself fails, we don't do this at all.
    try {
      newCatalogItem.sourceCatalogItem = props.catalogItem;
      let csvItem = null;
      for (let i = 0; i < newCatalogItem.items.length; i++) {
        if (newCatalogItem.items[i].type === "csv")
          csvItem = newCatalogItem.items[i];
      }
      const tableStructure = csvItem.tableStructure;
      tableStructure.sourceFeature = props.feature;
      if (defined(existingColors)) {
        tableStructure.columns.forEach((column, columnNumber) => {
          column.color = existingColors[columnNumber];
        });
      }
      if (defined(activeConcepts) && activeConcepts.some(a => a)) {
        tableStructure.columns.forEach((column, columnNumber) => {
          column.isActive = activeConcepts[columnNumber];
        });
      }
      csvItem.setChartable();
    } catch (e) {
      // This does not actually make it to the user.
      return raiseErrorToUser(terria, e);
    }
  });
}

module.exports = withTranslation()(ChartExpandAndDownloadButtons);
