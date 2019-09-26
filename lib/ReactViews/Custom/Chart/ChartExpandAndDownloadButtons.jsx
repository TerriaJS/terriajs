import classNames from "classnames";
import { runInAction } from "mobx";
import PropTypes from "prop-types";
import React from "react";
import clone from "terriajs-cesium/Source/Core/clone";
import raiseErrorOnRejectedPromise from "../../../Models/raiseErrorOnRejectedPromise";
import Dropdown from "../../Generic/Dropdown";
import Styles from "./chart-expand-and-download-buttons.scss";
import Icon from "../../Icon";
import defined from "terriajs-cesium/Source/Core/defined";

export default class ChartExpandAndDownloadButtons extends React.Component {
  static propTypes = {
    sourceItems: PropTypes.array.isRequired,
    sourceNames: PropTypes.array,
    canDownload: PropTypes.bool,
    downloads: PropTypes.array,
    downloadNames: PropTypes.array,
    raiseToTitle: PropTypes.bool
  };

  expandButton = () => {
    expandItem(this.props, this.props.sourceItems.length - 1);
  };

  expandDropdown = (selected, sourceIndex) => {
    expandItem(this.props, sourceIndex);
  };

  render() {
    if (this.props.sourceItems.length === 0) {
      return null;
    }

    // The downloads and download names default to the sources and source names if not defined.
    const downloads = runInAction(() => {
      return (
        this.props.downloads || this.props.sourceItems.map(item => item.url)
      );
    });
    const downloadNames = this.props.downloadNames || this.props.sourceNames;
    let downloadButton;

    if (this.props.sourceNames) {
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
            Download&nbsp;▾
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
              Expand&nbsp;▾
            </Dropdown>
            {downloadButton}
          </div>
        </div>
      );
    }

    // We have just a single source, so render
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
          Expand
        </button>
        {downloadButton}
      </div>
    );
  }
}

/**
 * Expand sourceIndex item by adding it to the workbench.
 *
 * We also remove any existing sourceItems from workbench so that only one
 * source is shown at any time.
 */
function expandItem(props, sourceIndex) {
  const terria = props.terria;
  const workbench = terria.workbench;
  const sourceItem = props.sourceItems[sourceIndex];

  // remove any source item that is already in the workbench
  props.sourceItems.forEach(sourceItem => {
    workbench.items.forEach(workbenchItem => {
      if (sourceItem.uniqueId === workbenchItem.uniqueId) {
        workbench.remove(workbenchItem);
      }
    });
  });
  workbench.add(sourceItem);
  runInAction(() =>
    raiseErrorOnRejectedPromise(terria, sourceItem.loadChartItems())
  );
}
