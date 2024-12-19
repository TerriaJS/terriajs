import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import MappableMixin from "../../ModelMixins/MappableMixin";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "../DataCatalog/toggleItemOnMapFromCatalog";
import measureElement from "../HOCs/measureElement";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import Styles from "./mappable-preview.scss";
import WarningBox from "./WarningBox";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {MappableMixin.Instance} previewed
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

  refToMeasure: any;

  async toggleOnMap(event: any) {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    if (defined(this.props.viewState.storyShown)) {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      runInAction(() => (this.props.viewState.storyShown = false));
    }

    const keepCatalogOpen = event.shiftKey || event.ctrlKey;

    await toggleItemOnMapFromCatalog(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState,
      // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.previewed,
      keepCatalogOpen,
      {
        [ToggleOnMapOp.Add]: DataSourceAction.addFromPreviewButton,
        [ToggleOnMapOp.Remove]: DataSourceAction.removeFromPreviewButton
      }
    );
  }

  backToMap() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.explorerPanelIsVisible = false;
  }

  render() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const catalogItem = this.props.previewed;
    return (
      // @ts-expect-error TS(2339): Property 'root' does not exist on type 'IMappableP... Remove this comment to see the full error message
      <div className={Styles.root}>
        {MappableMixin.isMixedInto(catalogItem) &&
          !catalogItem.disablePreview && (
            <DataPreviewMap
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              previewed={catalogItem}
              showMap={
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                !this.props.viewState.explorerPanelAnimating ||
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                this.props.viewState.useSmallScreenInterface
              }
            />
          )}
        <button
          type="button"
          onClick={this.toggleOnMap.bind(this)}
          className={Styles.btnAdd}
        >
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          {this.props.terria.workbench.contains(catalogItem)
            ? t("preview.removeFromMap")
            : t("preview.addToMap")}
        </button>
        <div className={Styles.previewedInfo}>
          <div
            className={Styles.titleAndShareWrapper}
            ref={(component) => (this.refToMeasure = component)}
          >
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
            {!catalogItem.hasLocalData &&
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              !this.props.viewState.useSmallScreenInterface && (
                <div className={Styles.shareLinkWrapper}>
                  // @ts-expect-error TS(2739): Remove this comment to see the full error message
                  <SharePanel
                    catalogShare
                    catalogShareWithoutText
                    // @ts-expect-error TS(2339): Property 'widthFromMeasureElementHOC' does not exi... Remove this comment to see the full error message
                    modalWidth={this.props.widthFromMeasureElementHOC}
                    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                    terria={this.props.terria}
                    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                    viewState={this.props.viewState}
                  />
                </div>
              )}
          </div>
          {catalogItem.loadMetadataResult?.error && (
            <WarningBox
              error={catalogItem.loadMetadataResult?.error}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          )}
          {catalogItem.loadMapItemsResult?.error && (
            <WarningBox
              error={catalogItem.loadMapItemsResult?.error}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          )}
          <Description item={catalogItem} />
        </div>
      </div>
    );
  }
}

// @ts-expect-error TS(2345): Argument of type 'typeof MappablePreview' is not a... Remove this comment to see the full error message
export default withTranslation()(measureElement(MappablePreview));
