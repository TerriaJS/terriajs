import React from "react";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import { reaction, runInAction } from "mobx";
import { withTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import SearchBox from "../Search/SearchBox";
import SidebarSearch from "../Search/SidebarSearch";

import Box from "../../Styled/Box";

class SearchBoxAndResults extends React.Component {
  componentDidMount() {
    this.subscribeToProps();
  }

  componentDidUpdate() {
    this.subscribeToProps();
  }

  componentWillUnmount() {
    this.unsubscribeFromProps();
  }

  subscribeToProps() {
    this.unsubscribeFromProps();

    // TODO(wing): why is this a reaction here and not in viewState itself?
    // Close the search results when the Now Viewing changes (so that it's visible).
    this._nowViewingChangeSubscription = reaction(
      () => this.props.terria.workbench.items,
      () => {
        this.props.viewState.searchState.showLocationSearchResults = false;
      }
    );
  }

  unsubscribeFromProps() {
    if (this._nowViewingChangeSubscription) {
      this._nowViewingChangeSubscription();
      this._nowViewingChangeSubscription = undefined;
    }
  }
  changeSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.locationSearchText = newText;
    });

    if (newText.length === 0) {
      removeMarker(this.props.terria);
    }
  }
  search() {
    this.props.viewState.searchState.searchLocations();
  }
  startLocationSearch() {
    runInAction(() => {
      this.props.viewState.searchState.showLocationSearchResults = true;
    });
  }
  render() {
    const { t } = this.props;
    const searchState = this.props.viewState.searchState;

    return (
      <>
        <SearchBox
          onSearchTextChanged={this.changeSearchText.bind(this)}
          onDoSearch={this.search.bind(this)}
          onFocus={this.startLocationSearch.bind(this)}
          searchText={searchState.locationSearchText}
          placeholder={t("search.placeholder")}
        />
        <Box>
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
          </Choose>
        </Box>
        {/* box */}
        {/* saerch sydney in data catalog */}
        {/* location search results */}
      </>
    );
  }
}

SearchBoxAndResults.propTypes = {
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
};

export default withTranslation()(observer(SearchBoxAndResults));
