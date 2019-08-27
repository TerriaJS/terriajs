import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { addMarker } from "../../Models/LocationMarkerUtils";
import BadgeBar from "../BadgeBar";
import LocationSearchResults from "./LocationSearchResults";
import Styles from "./sidebar-search.scss";

// Handle any of the three kinds of search based on the props
const SidebarSearch = observer(
  createReactClass({
    displayName: "SidebarSearch",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      isWaitingForSearchToStart: PropTypes.bool,
      terria: PropTypes.object.isRequired
    },

    backToNowViewing() {
      this.props.viewState.searchState.showLocationSearchResults = false;
    },

    onLocationClick(result) {
      addMarker(this.props.terria, result);
      result.clickAction();
    },

    render() {
      return (
        <div className={Styles.search}>
          <div className={Styles.results}>
            <BadgeBar label="Search Results">
              <button
                type="button"
                onClick={this.backToNowViewing}
                className={Styles.btnDone}
              >
                Done
              </button>
            </BadgeBar>
            <div className={Styles.resultsContent}>
              <If
                condition={
                  this.props.viewState.searchState.locationSearchText.length > 0
                }
              >
                {/* TODO: Put this back once we add a MobX DataCatalogSearch Provider */}
                {/* <SideBarDatasetSearchResults
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                /> */}
              </If>
              <For
                each="search"
                of={this.props.viewState.searchState.locationSearchResults}
              >
                <LocationSearchResults
                  key={search.searchProvider.name}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                  search={search}
                  onLocationClick={this.onLocationClick}
                  isWaitingForSearchToStart={
                    this.props.isWaitingForSearchToStart
                  }
                />
              </For>
            </div>
          </div>
        </div>
      );
    }
  })
);

module.exports = SidebarSearch;
