import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import BadgeBar from "../BadgeBar.jsx";
import Styles from "./sidebar-search.scss";
import LocationSearchResults from "./LocationSearchResults.jsx";
import SideBarDatasetSearchResults from "./SideBarDatasetSearchResults.jsx";
import { withTranslation } from "react-i18next";

import { addMarker } from "../../Models/LocationMarkerUtils";

// Handle any of the three kinds of search based on the props
const SidebarSearch = createReactClass({
  displayName: "SidebarSearch",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    isWaitingForSearchToStart: PropTypes.bool,
    terria: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  backToNowViewing() {
    this.props.viewState.searchState.showLocationSearchResults = false;
  },

  onLocationClick(result) {
    addMarker(this.props.terria, result);
    result.clickAction();
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.search}>
        <div className={Styles.results}>
          <BadgeBar label={t("search.resultsLabel")}>
            <button
              type="button"
              onClick={this.backToNowViewing}
              className={Styles.btnDone}
            >
              {t("search.done")}
            </button>
          </BadgeBar>
          <div className={Styles.resultsContent}>
            <If
              condition={
                this.props.viewState.searchState.locationSearchText.length > 0
              }
            >
              <SideBarDatasetSearchResults
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </If>
            <For
              each="search"
              of={this.props.viewState.searchState.locationSearchProviders}
            >
              <LocationSearchResults
                key={search.name}
                terria={this.props.terria}
                viewState={this.props.viewState}
                search={search}
                onLocationClick={this.onLocationClick}
                isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}
              />
            </For>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(SidebarSearch);
