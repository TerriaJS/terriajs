import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import ObserveModelMixin from "../ObserveModelMixin";
import SearchBox from "../Search/SearchBox.jsx";
import SidebarSearch from "../Search/SidebarSearch.jsx";
import Workbench from "../Workbench/Workbench.jsx";
import Icon from "../Icon.jsx";
import FullScreenButton from "./FullScreenButton.jsx";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import { withTranslation, Trans } from "react-i18next";
import Styles from "./side-panel.scss";

const SidePanel = createReactClass({
  displayName: "SidePanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  componentDidMount() {
    this.subscribeToProps();
  },

  componentDidUpdate() {
    this.subscribeToProps();
  },

  componentWillUnmount() {
    this.unsubscribeFromProps();
  },

  subscribeToProps() {
    this.unsubscribeFromProps();

    // Close the search results when the Now Viewing changes (so that it's visible).
    this._nowViewingChangeSubscription = knockout
      .getObservable(this.props.terria.nowViewing, "items")
      .subscribe(() => {
        this.props.viewState.searchState.showLocationSearchResults = false;
      });
  },

  unsubscribeFromProps() {
    if (this._nowViewingChangeSubscription) {
      this._nowViewingChangeSubscription.dispose();
      this._nowViewingChangeSubscription = undefined;
    }
  },

  onAddDataClicked(event) {
    event.stopPropagation();
    this.props.viewState.topElement = "AddData";
    this.props.viewState.openAddData();
  },

  onAddLocalDataClicked(event) {
    event.stopPropagation();
    this.props.viewState.topElement = "AddData";
    this.props.viewState.openUserData();
  },

  changeSearchText(newText) {
    this.props.viewState.searchState.locationSearchText = newText;

    if (newText.length === 0) {
      removeMarker(this.props.terria);
    }
  },

  search() {
    this.props.viewState.searchState.searchLocations();
  },

  startLocationSearch() {
    this.props.viewState.searchState.showLocationSearchResults = true;
  },

  render() {
    const { t } = this.props;
    const searchState = this.props.viewState.searchState;
    const addData = t("addData.addDataBtnText");
    return (
      <div className={Styles.workBench}>
        <div className={Styles.header}>
          <FullScreenButton
            terria={this.props.terria}
            viewState={this.props.viewState}
            minified={true}
            animationDuration={250}
            btnText={t("addData.btnHide")}
          />

          <SearchBox
            onSearchTextChanged={this.changeSearchText}
            onDoSearch={this.search}
            onFocus={this.startLocationSearch}
            searchText={searchState.locationSearchText}
            placeholder={t("search.placeholder")}
          />
          <div className={Styles.addData}>
            <button
              type="button"
              onClick={this.onAddDataClicked}
              className={Styles.button}
              title={addData}
            >
              <Icon glyph={Icon.GLYPHS.add} />
              {addData}
            </button>
            <button
              type="button"
              onClick={this.onAddLocalDataClicked}
              className={Styles.uploadData}
              title={t("addData.load")}
            >
              <Icon glyph={Icon.GLYPHS.upload} />
            </button>
          </div>
        </div>
        <div className={Styles.body}>
          <Choose>
            <When
              condition={
                searchState.locationSearchText.length > 0 &&
                searchState.showLocationSearchResults
              }
            >
              <SidebarSearch
                terria={this.props.terria}
                viewState={this.props.viewState}
                isWaitingForSearchToStart={
                  searchState.isWaitingToStartLocationSearch
                }
              />
            </When>
            <When
              condition={
                this.props.terria.nowViewing.items &&
                this.props.terria.nowViewing.items.length > 0
              }
            >
              <Workbench
                viewState={this.props.viewState}
                terria={this.props.terria}
              />
            </When>
            <Otherwise>
              <Trans i18nKey="emptyWorkbenchMessage">
                <div className={Styles.workbenchEmpty}>
                  <div>Your workbench is empty</div>
                  <p>
                    <strong>Click &apos;{addData}&apos; above to:</strong>
                  </p>
                  <ul>
                    <li>Browse the Data Catalogue</li>
                    <li>Load your own data onto the map</li>
                  </ul>
                  <p>
                    <Icon glyph={Icon.GLYPHS.bulb} />
                    <strong>TIP:</strong>
                    <em>All your active data sets will be listed here</em>
                  </p>
                </div>
              </Trans>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(SidePanel);
