import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Box from "../../Styled/Box";
import Icon from "../../Styled/Icon";
import DataCatalog from "../DataCatalog/DataCatalog";
import DataPreview from "../Preview/DataPreview";
import WorkbenchList from "../Workbench/WorkbenchList";
import Styles from "./mobile-modal-window.scss";
import MobileSearch from "./MobileSearch";
import MappableMixin from "../../ModelMixins/MappableMixin";
import MyDataTab from "../ExplorerWindow/Tabs/MyDataTab/MyDataTab.jsx";

@observer
class MobileModalWindow extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  async onFileAddFinished(files) {
    const file = files.find(f => MappableMixin.isMixedInto(f));
    if (file) {
      const result = await this.props.viewState.viewCatalogMember(file);
      if (result.error) {
        result.raiseError(this.props.terria);
      } else {
        this.props.terria.currentViewer.zoomTo(file, 1);
      }
    }
    this.props.viewState.myDataIsUploadView = false;
  }

  renderModalContent() {
    const viewState = this.props.viewState;
    const searchState = viewState.searchState;

    if (
      viewState.mobileView !== viewState.mobileViewOptions.data &&
      viewState.mobileView !== viewState.mobileViewOptions.preview &&
      searchState.showMobileLocationSearch &&
      searchState.locationSearchText.length > 0
    ) {
      return (
        <MobileSearch
          terria={this.props.terria}
          viewState={this.props.viewState}
        />
      );
    }

    switch (viewState.mobileView) {
      case viewState.mobileViewOptions.data:
        // No multiple catalogue tabs in mobile
        return (
          <div>
            <div>
              <DataCatalog
                items={this.props.terria.catalog.userAddedDataGroup.items}
                removable={true}
                viewState={this.props.viewState}
                terria={this.props.terria}
              />
            </div>
            <div>
              <DataCatalog
                terria={this.props.terria}
                viewState={this.props.viewState}
                items={this.props.terria.catalog.group.memberModels}
              />
            </div>
          </div>
        );
      case viewState.mobileViewOptions.addData:
        return (
          <MyDataTab
            terria={this.props.terria}
            viewState={this.props.viewState}
            onFileAddFinished={files => this.onFileAddFinished(files)}
          />
        );
      case viewState.mobileViewOptions.preview:
        return (
          <DataPreview
            terria={this.props.terria}
            viewState={this.props.viewState}
            previewed={this.props.viewState.previewedItem}
          />
        );
      case viewState.mobileViewOptions.nowViewing:
        return (
          <WorkbenchList
            viewState={this.props.viewState}
            terria={this.props.terria}
          />
        );
      default:
        return null;
    }
  }

  onClearMobileUI() {
    runInAction(() => {
      this.props.viewState.switchMobileView(null);
      this.props.viewState.explorerPanelIsVisible = false;
      this.props.viewState.searchState.showMobileLocationSearch = false;
      this.props.viewState.searchState.showMobileCatalogSearch = false;
      this.props.viewState.searchState.catalogSearchText = "";
    });
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps() {
    const numItems = this.props.terria.workbench.items.length;
    if (
      (numItems === undefined || numItems === 0) &&
      this.props.viewState.mobileView ===
        this.props.viewState.mobileViewOptions.nowViewing
    ) {
      runInAction(() => {
        this.props.viewState.switchMobileView(null);
        this.props.viewState.explorerPanelIsVisible = false;
      });
    }
  }

  goBack() {
    this.props.viewState.switchMobileView(
      this.props.viewState.mobileViewOptions.data
    );
  }

  render() {
    const modalClass = classNames(Styles.mobileModal, {
      [Styles.isOpen]:
        this.props.viewState.explorerPanelIsVisible &&
        this.props.viewState.mobileView
    });
    const mobileView = this.props.viewState.mobileView;
    const { t } = this.props;

    return (
      <div className={modalClass}>
        <Box column className={Styles.modalBg}>
          <div className={Styles.modalTop}>
            {this.props.viewState.explorerPanelIsVisible && mobileView && (
              <button
                type="button"
                className={Styles.doneButton}
                onClick={() => this.onClearMobileUI()}
              >
                {t("mobile.doneBtnText")}
              </button>
            )}
            <button
              type="button"
              disabled={
                mobileView !== this.props.viewState.mobileViewOptions.preview
              }
              className={classNames(Styles.backButton, {
                [Styles.backButtonInactive]:
                  mobileView !== this.props.viewState.mobileViewOptions.preview
              })}
              onClick={() => this.goBack()}
            >
              <Icon className={Styles.iconBack} glyph={Icon.GLYPHS.left} />
            </button>
          </div>

          {this.renderModalContent()}
        </Box>
      </div>
    );
  }
}
module.exports = withTranslation()(MobileModalWindow);
