"use strict";
import classNames from "classnames";
import {
  action,
  autorun,
  computed,
  makeObservable,
  runInAction,
  trace
} from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import ViewerMode from "../../Models/ViewerMode";
import PreviewViewer from "../../ViewModels/PreviewViewer";
import Styles from "./data-preview-map.scss";

/**
 * Leaflet-based preview map that sits within the preview.
 */

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {Mappable} previewed
 * @prop {boolean} showMap
 *
 */

// TODO: Can this.props.previewed be undefined?
/**
 *
 * @extends {React.Component<Props>}
 */
@observer
class DataPreviewMap extends Component {
  /**
   * @type {TerriaViewer}
   * @readonly
   */
  previewViewer;

  static propTypes = {
    terria: PropTypes.object.isRequired,
    previewed: PropTypes.object,
    showMap: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  @computed
  get previewBadgeState() {
    if (this.props.previewed?.isLoading) return "loading";
    if (
      this.props.previewed?.loadMetadataResult?.error ||
      this.props.previewed?.loadMapItemsResult?.error
    )
      return "dataPreviewError";
    if (this.props.previewed?.mapItems?.length === 0)
      return "noPreviewAvailable";

    return "dataPreview";
  }

  constructor(props) {
    super(props);

    makeObservable(this);

    /**
     * @param {HTMLElement | null} container
     */
    this.containerRef = action((container) => {
      if (this.previewViewer.attached) {
        this.previewViewer.detach();
      }
      if (container !== null) {
        this.initPreview(container);
      }
    });
    this.previewViewer = new PreviewViewer(
      this.props.terria,
      // pass in computed so that the prop changes are propogated
      computed(() => this.props.previewed)
    );

    runInAction(() => {
      this.previewViewer.viewerMode = ViewerMode.Leaflet;
      this.previewViewer.disableInteraction = true;
      this.previewViewer.homeCamera = this.props.terria.mainViewer.homeCamera;
    });

    window.previewViewer = this.previewViewer;
    // Not yet implemented
    // previewViewer.hideTerriaLogo = true;
    // previewViewer.homeView = terria.homeView;
    // previewViewer.initialView = terria.homeView;
  }

  /**
   * @param {HTMLElement} container
   */
  @action
  initPreview(container) {
    console.log(
      "Initialising preview map. This might be expensive, so this should only show up when the preview map disappears and reappears"
    );
    this.previewViewer.isZoomedToExtent = false;
    const baseMapItems = this.props.terria.baseMapsModel.baseMapItems;
    // Find preview basemap using `terria.previewBaseMapId`
    const initPreviewBaseMap = baseMapItems.find(
      (baseMap) =>
        baseMap.item.uniqueId ===
        this.props.terria.baseMapsModel.previewBaseMapId
    );
    if (initPreviewBaseMap !== undefined) {
      this.previewViewer.setBaseMap(initPreviewBaseMap.item);
    } else {
      this.previewViewer.setBaseMap(
        baseMapItems.length > 0 ? baseMapItems[0].item : undefined
      );
    }

    this.previewViewer.attach(container);

    this._disposeZoomToExtentSubscription = autorun(() => {
      if (this.previewViewer.isZoomedToExtent) {
        this.previewViewer.currentViewer.zoomTo(this.props.previewed);
      } else {
        this.previewViewer.currentViewer.zoomTo(this.previewViewer.homeCamera);
      }
    });
  }

  componentWillUnmount() {
    if (this._disposeZoomToExtentSubscription) {
      this._disposeZoomToExtentSubscription();
    }
    this.previewViewer.detach();

    if (this._unsubscribeErrorHandler) {
      this._unsubscribeErrorHandler();
      this._unsubscribeErrorHandler = undefined;
    }
  }

  @action.bound
  clickMap(_evt) {
    this.previewViewer.isZoomedToExtent = !this.previewViewer.isZoomedToExtent;
  }

  render() {
    trace();
    const { t } = this.props;
    const previewBadgeLabels = {
      loading: t("preview.loading"),
      noPreviewAvailable: t("preview.noPreviewAvailable"),
      dataPreview: t("preview.dataPreview"),
      dataPreviewError: t("preview.dataPreviewError")
    };
    return (
      <div className={Styles.map} onClick={this.clickMap}>
        {this.props.showMap ? (
          <div
            className={classNames(Styles.terriaPreview)}
            ref={this.containerRef}
          />
        ) : (
          <div
            className={classNames(Styles.terriaPreview, Styles.placeholder)}
          />
        )}
        <label className={Styles.badge}>
          {previewBadgeLabels[this.previewBadgeState]}
        </label>
      </div>
    );
  }
}

export default withTranslation()(DataPreviewMap);
