import classNames from "classnames";
import { action, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import clone from "terriajs-cesium/Source/Core/clone";
import raiseErrorOnRejectedPromise from "../../../Models/raiseErrorOnRejectedPromise";
import Dropdown from "../../Generic/Dropdown";
import Styles from "./chart-expand-and-download-buttons.scss";
import Icon from "../../Icon";
import defined from "terriajs-cesium/Source/Core/defined";
import filterOutUndefined from "../../../Core/filterOutUndefined";

@observer
class ChartExpandAndDownloadButtons extends React.Component {
  @observable sourceItems = [];

  static propTypes = {
    terria: PropTypes.object.isRequired,
    sourceItems: PropTypes.array.isRequired, // Array of items or Promise returning item
    sourceNames: PropTypes.array,
    canDownload: PropTypes.bool,
    downloads: PropTypes.array,
    downloadNames: PropTypes.array,
    raiseToTitle: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  @action
  expandButton = () => {
    expandItem(
      this.sourceItems,
      this.sourceItems.length - 1,
      this.props.terria
    );
  };

  @action
  expandDropdown = (selected, sourceIndex) => {
    expandItem(this.sourceItems, sourceIndex, this.props.terria);
  };

  resolveSourceItems() {
    Promise.all(
      this.props.sourceItems.map(sourceItem => Promise.resolve(sourceItem))
    ).then(
      action(results => {
        this.sourceItems = filterOutUndefined(results);
      })
    );
  }

  componentDidMount() {
    this.resolveSourceItems();
  }

  componentDidUpdate(prevProps) {
    if (this.props.sourceItems !== prevProps.sourceItems) {
      this.resolveSourceItems();
    }
  }

  render() {
    if (this.sourceItems.length === 0) {
      return null;
    }

    // The downloads and download names default to the sources and source names if not defined.
    const downloads = runInAction(() => {
      return this.props.downloads || this.sourceItems.map(item => item.url);
    });
    const downloadNames = this.props.downloadNames || this.props.sourceNames;
    let downloadButton;
    const { t } = this.props;
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
          {t("chart.expand")}
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
function expandItem(sourceItems, sourceIndex, terria) {
  const workbench = terria.workbench;
  const sourceItem = sourceItems[sourceIndex];

  // remove any source item that is already in the workbench
  sourceItems.forEach(sourceItem => {
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
export default withTranslation()(ChartExpandAndDownloadButtons);
