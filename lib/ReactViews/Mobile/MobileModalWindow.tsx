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

@observer
class MobileModalWindow extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  renderModalContent() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
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
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
        />
      );
    }

    switch (viewState.mobileView) {
      case viewState.mobileViewOptions.data:
        // No multiple catalogue tabs in mobile
        return (
          <DataCatalog
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            items={this.props.terria.catalog.group.memberModels}
          />
        );
      case viewState.mobileViewOptions.preview:
        return (
          <DataPreview
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            previewed={this.props.viewState.previewedItem}
          />
        );
      case viewState.mobileViewOptions.nowViewing:
        return (
          <WorkbenchList
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
          />
        );
      default:
        return null;
    }
  }

  onClearMobileUI() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.switchMobileView(null);
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.explorerPanelIsVisible = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showMobileLocationSearch = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showMobileCatalogSearch = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.catalogSearchText = "";
    });
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const numItems = this.props.terria.workbench.items.length;
    if (
      (numItems === undefined || numItems === 0) &&
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.mobileView ===
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.mobileViewOptions.nowViewing
    ) {
      runInAction(() => {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.switchMobileView(null);
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible = false;
      });
    }
  }

  goBack() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.switchMobileView(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.mobileViewOptions.data
    );
  }

  render() {
    const modalClass = classNames(Styles.mobileModal, {
      [Styles.isOpen]:
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible &&
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.mobileView
    });
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const mobileView = this.props.viewState.mobileView;
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;

    return (
      <div className={modalClass}>
        <Box column className={Styles.modalBg}>
          <div className={Styles.modalTop}>
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on
            type 'Reado... Remove this comment to see the full error message
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
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                mobileView !== this.props.viewState.mobileViewOptions.preview
              }
              className={classNames(Styles.backButton, {
                [Styles.backButtonInactive]:
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
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

export default withTranslation()(MobileModalWindow);
