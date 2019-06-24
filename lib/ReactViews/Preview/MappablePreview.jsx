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
    viewState: PropTypes.object.isRequired
  };

  @action.bound
  toggleOnMap(event) {
    if (defined(this.props.viewState.storyShown)) {
      this.props.viewState.storyShown = false;
    }
    const catalogItem = this.props.previewed;
    if (catalogItem.loadReference) {
      // TODO: handle promise rejection
      catalogItem.loadReference();
    }
    const workbench = this.props.terria.workbench;
    if (workbench.contains(catalogItem)) {
      workbench.remove(catalogItem);
    } else {
      if (catalogItem.loadMapItems) {
        // TODO: handle promise rejection.
        catalogItem.loadMapItems();
      }

      workbench.add(catalogItem);
    }

    if (workbench.contains(catalogItem) && !event.shiftKey && !event.ctrlKey) {
      this.props.viewState.explorerPanelIsVisible = false;
      this.props.viewState.mobileView = null;
    }
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
          <h3 className={Styles.h3}>{catalogItem.name}</h3>
          <Description item={catalogItem} />
        </div>
      </div>
    );
  }
}
export default MappablePreview;
