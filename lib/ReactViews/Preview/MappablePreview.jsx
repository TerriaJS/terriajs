import { action } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import getPath from "../../Core/getPath";
import addToWorkbench from "../../Models/addToWorkbench";
import Mappable from "../../Models/Mappable";
import raiseErrorOnRejectedPromise from "../../Models/raiseErrorOnRejectedPromise";
// eslint-disable-next-line no-unused-vars
import Terria from "../../Models/Terria";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../ReactViewModels/ViewState";
import SharePanel from "../Map/Panels/SharePanel/SharePanel.jsx";
import measureElement from "../HOCs/measureElement";
import DataPreviewMap from "./DataPreviewMap";
// import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import Styles from "./mappable-preview.scss";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary.jsx";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {Mappable} previewed
 * @prop {ViewState} viewState
 *
 */

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 * @extends {React.Component<Props>}
 */
@observer
class MappablePreview extends React.Component {
  static propTypes = {
    previewed: PropTypes.object.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    widthFromMeasureElementHOC: PropTypes.number,
    t: PropTypes.func.isRequired
  };

  @action.bound
  toggleOnMap(event) {
    if (defined(this.props.viewState.storyShown)) {
      this.props.viewState.storyShown = false;
    }

    const keepCatalogOpen = event.shiftKey || event.ctrlKey;
    const toAdd = !this.props.terria.workbench.contains(this.props.previewed);

    if (toAdd) {
      this.props.terria.timelineStack.addToTop(this.props.previewed);
    } else {
      this.props.terria.timelineStack.remove(this.props.previewed);
    }

    const addPromise = addToWorkbench(
      this.props.terria.workbench,
      this.props.previewed,
      toAdd
    ).then(() => {
      if (
        this.props.terria.workbench.contains(this.props.previewed) &&
        !keepCatalogOpen
      ) {
        this.props.viewState.closeCatalog();
        this.props.terria.analytics?.logEvent(
          "dataSource",
          toAdd ? "addFromPreviewButton" : "removeFromPreviewButton",
          getPath(this.props.previewed)
        );
      }
    });

    raiseErrorOnRejectedPromise(addPromise);
  }

  backToMap() {
    this.props.viewState.explorerPanelIsVisible = false;
  }

  render() {
    const { t } = this.props;
    const catalogItem = this.props.previewed;
    return (
      <div className={Styles.root}>
        <If
          condition={
            Mappable.is(catalogItem) &&
            !catalogItem.disablePreview &&
            this.props.viewState.explorerPanelIsVisible
          }
        >
          <ErrorBoundary terria={this.props.terria}>
            <DataPreviewMap
              key={[
                catalogItem.uniqueId,
                this.props.viewState.explorerPanelIsVisible
              ]}
              terria={this.props.terria}
              previewed={catalogItem}
              showMap={
                !this.props.viewState.explorerPanelAnimating ||
                this.props.viewState.useSmallScreenInterface
              }
            />
          </ErrorBoundary>
        </If>
        <button
          type="button"
          onClick={this.toggleOnMap}
          className={Styles.btnAdd}
        >
          {this.props.terria.workbench.contains(catalogItem)
            ? t("preview.removeFromMap")
            : t("preview.addToMap")}
        </button>
        <div className={Styles.previewedInfo}>
          <div
            className={Styles.titleAndShareWrapper}
            ref={component => (this.refToMeasure = component)}
          >
            <h1 className={Styles.heading}>{catalogItem.name}</h1>
            <If
              condition={
                !catalogItem.hasLocalData &&
                !this.props.viewState.useSmallScreenInterface
              }
            >
              <div className={Styles.shareLinkWrapper}>
                <SharePanel
                  catalogShare
                  catalogShareWithoutText
                  modalWidth={this.props.widthFromMeasureElementHOC}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </If>
          </div>
          <Description item={catalogItem} />
        </div>
      </div>
    );
  }
}

export default withTranslation()(measureElement(MappablePreview));
