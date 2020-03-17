import React from "react";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import { reaction, runInAction } from "mobx";
import { Trans, withTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
// import { ThemeContext } from "styled-components";

import SearchBox from "../Search/SearchBox";
import SidebarSearch from "../Search/SidebarSearch";

import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import Icon from "../Icon";

function SearchInDataCatalog({ viewState }) {
  const locationSearchText = viewState.searchState.locationSearchText;
  return (
    <RawButton
      onClick={() => {
        const { searchState } = viewState;
        runInAction(() => {
          // Set text here so that it doesn't get batched up and the catalog
          // search text has a chance to set isWaitingToStartCatalogSearch
          searchState.catalogSearchText = searchState.locationSearchText;
        });
        viewState.searchInCatalog(searchState.locationSearchText);
      }}
    >
      <Box paddedRatio={2} rounded charcoalGreyBg>
        <Box
          css={`
            width: 15px;
          `}
          flexShrinkZero
        >
          <Icon glyph={Icon.GLYPHS["dataCatalog"]} />
        </Box>
        <Spacing right={2} />
        <Text textAlignLeft textLight large>
          <Trans
            i18nKey="search.searchInDataCatalog"
            locationSearchText={locationSearchText}
          >
            Search <strong>{{ locationSearchText }}</strong> in the Data
            Catalogue
          </Trans>
        </Text>
      </Box>
    </RawButton>
  );
}
SearchInDataCatalog.propTypes = {
  // theme: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
};

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
    const viewState = this.props.viewState;
    const searchState = viewState.searchState;

    return (
      <Text textDarker>
        <SearchBox
          onSearchTextChanged={this.changeSearchText.bind(this)}
          onDoSearch={this.search.bind(this)}
          onFocus={this.startLocationSearch.bind(this)}
          searchText={searchState.locationSearchText}
          placeholder={t("search.placeholder")}
        />
        {/* Results */}
        <Box
          column
          paddedRatio={2}
          css={`
            background-color: ${props => props.theme.greyLightest};
          `}
        >
          {/* box */}
          {/* search sydney in data catalog */}
          {/* location search results ( 3 results etc) */}
          <Choose>
            <When
              condition={
                searchState.locationSearchText.length > 0 &&
                searchState.showLocationSearchResults
              }
            >
              <Spacing bottom={2} />
              <SearchInDataCatalog viewState={viewState} t={t} />
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
      </Text>
    );
  }
}

SearchBoxAndResults.propTypes = {
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
};

export default withTranslation()(observer(SearchBoxAndResults));
