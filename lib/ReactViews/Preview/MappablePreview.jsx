import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Mappable from "../../Models/Mappable";
// eslint-disable-next-line no-unused-vars
import Terria from "../../Models/Terria";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../ReactViewModels/ViewState";
import DataPreviewMap from "./DataPreviewMap";
// import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import Styles from "./mappable-preview.scss";
import { observer } from "mobx-react";
import { action } from "mobx";
import measureElement from "../measureElement";
import SharePanel from "../Map/Panels/SharePanel/SharePanel.jsx";
import { withTranslation } from "react-i18next";
import addToWorkbench from "../../Models/addToWorkbench";
import { runInAction } from "mobx";
import raiseErrorOnRejectedPromise from "../../Models/raiseErrorOnRejectedPromise";

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

    const addPromise = addToWorkbench(
      this.props.terria.workbench,
      this.props.previewed,
      !this.props.terria.workbench.contains(this.props.previewed)
    ).then(() => {
      if (
        this.props.terria.workbench.contains(this.props.previewed) &&
        !keepCatalogOpen
      ) {
        runInAction(() => {
          this.props.viewState.explorerPanelIsVisible = false;
          this.props.viewState.mobileView = null;
        });
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
        <If condition={Mappable.is(catalogItem) && !catalogItem.disablePreview}>
          <DataPreviewMap
            terria={this.props.terria}
            previewed={catalogItem}
            showMap={
              !this.props.viewState.explorerPanelAnimating ||
              this.props.viewState.useSmallScreenInterface
            }
          />
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
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
            <If
              condition={
                catalogItem.dataUrlType !== "local" &&
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
