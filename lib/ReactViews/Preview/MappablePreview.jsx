import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import getPath from "../../Core/getPath";
import MappableMixin from "../../ModelMixins/MappableMixin";
import { ROOT_ROUTE } from "../../ReactViewModels/TerriaRouting";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary.jsx";
import measureElement from "../HOCs/measureElement";
import SharePanel from "../Map/Panels/SharePanel/SharePanel.jsx";
import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import Styles from "./mappable-preview.scss";
import {
  Category,
  DataSourceAction
} from "../../Core/AnalyticEvents/analyticEvents";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {MappableMixin.MappableMixin} previewed
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

  async toggleOnMap(event) {
    if (defined(this.props.viewState.storyShown)) {
      runInAction(() => (this.props.viewState.storyShown = false));
    }

    const keepCatalogOpen = event.shiftKey || event.ctrlKey;
    const toAdd = !this.props.terria.workbench.contains(this.props.previewed);

    try {
      if (toAdd) {
        this.props.terria.timelineStack.addToTop(this.props.previewed);
        await this.props.terria.workbench.add(this.props.previewed);
      } else {
        this.props.terria.timelineStack.remove(this.props.previewed);
        this.props.terria.workbench.remove(this.props.previewed);
      }
      if (
        this.props.terria.workbench.contains(this.props.previewed) &&
        !keepCatalogOpen
      ) {
        this.props.viewState.closeCatalog();
        this.props.viewState.history?.push(ROOT_ROUTE);
        this.props.terria.analytics?.logEvent(
          Category.dataSource,
          toAdd
            ? DataSourceAction.addFromPreviewButton
            : DataSourceAction.removeFromPreviewButton,
          getPath(this.props.previewed)
        );
      }
    } catch (e) {
      this.props.terria.raiseErrorToUser(e);
    }
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
            MappableMixin.isMixedInto(catalogItem) &&
            !catalogItem.disablePreview
          }
        >
          <ErrorBoundary terria={this.props.terria}>
            <DataPreviewMap
              key={catalogItem.uniqueId}
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
          onClick={this.toggleOnMap.bind(this)}
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
