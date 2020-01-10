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
    widthFromMeasureElementHOC: PropTypes.number
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
            ? "Remove from the map"
            : "Add to the map"}
        </button>
        <div className={Styles.previewedInfo}>
          <div
            className={Styles.titleAndShareWrapper}
            ref={component => (this.refToMeasure = component)}
          >
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
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

export default measureElement(MappablePreview);
