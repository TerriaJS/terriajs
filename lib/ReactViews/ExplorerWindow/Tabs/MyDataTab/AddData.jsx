import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Icon from "../../../Icon.jsx";
import addUserCatalogMember from "../../../../Models/addUserCatalogMember";
import createCatalogItemFromFileOrUrl from "../../../../Models/createCatalogItemFromFileOrUrl";
import createCatalogMemberFromType from "../../../../Models/createCatalogMemberFromType";
import Dropdown from "../../../Generic/Dropdown";
import FileInput from "./FileInput.jsx";
import getDataType from "../../../../Core/getDataType";
import ObserveModelMixin from "../../../ObserveModelMixin";
import TerriaError from "../../../../Core/TerriaError";
import addUserFiles from "../../../../Models/addUserFiles";
import Styles from "./add-data.scss";
import Loader from "../../../Loader";
import { withTranslation, Trans } from "react-i18next";

// Local and remote data have different dataType options
const remoteDataType = getDataType().remoteDataType;
const localDataType = getDataType().localDataType;

/**
 * Add data panel in modal window -> My data tab
 */
const AddData = createReactClass({
  displayName: "AddData",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    resetTab: PropTypes.func,
    activeTab: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      localDataType: localDataType[0], // By default select the first item (auto)
      remoteDataType: remoteDataType[0],
      remoteUrl: "", // By default there's no remote url
      isLoading: false
    };
  },

  selectLocalOption(option) {
    this.setState({
      localDataType: option
    });
  },

  selectRemoteOption(option) {
    this.setState({
      remoteDataType: option
    });
  },

  handleUploadFile(e) {
    this.setState({
      isLoading: true
    });
    addUserFiles(
      e.target.files,
      this.props.terria,
      this.props.viewState,
      this.state.localDataType
    ).then(addedCatalogItems => {
      if (addedCatalogItems.length > 0) {
        this.onFileAddFinished(addedCatalogItems[0]);
      }
      this.setState({
        isLoading: false
      });
      // reset active tab when file handling is done
      this.props.resetTab();
    });
  },

  handleUrl(e) {
    const url = this.state.remoteUrl;
    e.preventDefault();
    this.props.terria.analytics.logEvent("addDataUrl", url);
    const that = this;
    this.setState({
      isLoading: true
    });
    let promise;
    if (that.state.remoteDataType.value === "auto") {
      promise = loadFile(that);
    } else {
      const newItem = createCatalogMemberFromType(
        that.state.remoteDataType.value,
        that.props.terria
      );
      newItem.name = that.state.remoteUrl;
      newItem.url = that.state.remoteUrl;
      promise = newItem.load().then(function() {
        return newItem;
      });
    }
    addUserCatalogMember(this.props.terria, promise).then(addedItem => {
      if (addedItem && !(addedItem instanceof TerriaError)) {
        this.onFileAddFinished(addedItem);
      }
      this.setState({
        isLoading: false
      });
      this.props.resetTab();
    });
  },

  onFileAddFinished(fileToSelect) {
    this.props.viewState.myDataIsUploadView = false;
    this.props.viewState.viewCatalogMember(fileToSelect);
  },

  onRemoteUrlChange(event) {
    this.setState({
      remoteUrl: event.target.value
    });
  },

  renderPanels() {
    const { t } = this.props;
    const dropdownTheme = {
      dropdown: Styles.dropdown,
      list: Styles.dropdownList,
      isOpen: Styles.dropdownListIsOpen,
      icon: <Icon glyph={Icon.GLYPHS.opened} />
    };

    const dataTypes = localDataType.reduce(function(result, currentDataType) {
      if (currentDataType.extensions) {
        return result.concat(
          currentDataType.extensions.map(extension => "." + extension)
        );
      } else {
        return result;
      }
    }, []);

    return (
      <div className={Styles.tabPanels}>
        <If condition={this.props.activeTab === "local"}>
          <div className={Styles.tabHeading}>{t("addData.localAdd")}</div>
          <section className={Styles.tabPanel}>
            <label className={Styles.label}>
              <Trans i18nKey="addData.localFileType">
                <strong>Step 1:</strong> Select file type (optional)
              </Trans>
            </label>
            <Dropdown
              options={localDataType}
              selected={this.state.localDataType}
              selectOption={this.selectLocalOption}
              matchWidth={true}
              theme={dropdownTheme}
            />
            <label className={Styles.label}>
              <Trans i18nKey="addData.localFile">
                <strong>Step 2:</strong> Select file
              </Trans>
            </label>
            <FileInput
              accept={dataTypes.join(",")}
              onChange={this.handleUploadFile}
            />
            {this.state.isLoading && <Loader />}
          </section>
        </If>
        <If condition={this.props.activeTab === "web"}>
          <div className={Styles.tabHeading}>{t("addData.webAdd")}</div>
          <section className={Styles.tabPanel}>
            <label className={Styles.label}>
              <Trans i18nKey="addData.webFileType">
                <strong>Step 1:</strong> Select file type (optional)
              </Trans>
            </label>
            <Dropdown
              options={remoteDataType}
              selected={this.state.remoteDataType}
              selectOption={this.selectRemoteOption}
              matchWidth={true}
              theme={dropdownTheme}
            />
            <label className={Styles.label}>
              <Trans i18nKey="addData.webFile">
                <strong>Step 2:</strong> Enter the URL of the data file or web
                service
              </Trans>
            </label>
            <form className={Styles.urlInput}>
              <input
                value={this.state.remoteUrl}
                onChange={this.onRemoteUrlChange}
                className={Styles.urlInputTextBox}
                type="text"
                placeholder="e.g. http://data.gov.au/geoserver/wms"
              />
              <button
                type="submit"
                onClick={this.handleUrl}
                className={Styles.urlInputBtn}
              >
                {t("addData.urlInputBtn")}
              </button>
              {this.state.isLoading && <Loader />}
            </form>
          </section>
        </If>
      </div>
    );
  },

  render() {
    return <div className={Styles.inner}>{this.renderPanels()}</div>;
  }
});

/**
 * Loads a catalog item from a file.
 */
function loadFile(viewModel) {
  return createCatalogItemFromFileOrUrl(
    viewModel.props.terria,
    viewModel.props.viewState,
    viewModel.state.remoteUrl,
    viewModel.state.remoteDataType.value,
    true
  );
}

module.exports = withTranslation()(AddData);
