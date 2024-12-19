import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { addMarker, removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import LocationSearchResults from "../Search/LocationSearchResults";
import SearchBox from "../Search/SearchBox";

export function SearchInDataCatalog({
  viewState,
  handleClick
}: any) {
  const locationSearchText = viewState.searchState.locationSearchText;
  const { t } = useTranslation();
  return (
    <RawButton
      fullWidth
      onClick={() => {
        const { searchState } = viewState;
        // Set text here as a separate action so that it doesn't get batched up and the catalog
        // search text has a chance to set isWaitingToStartCatalogSearch
        searchState.setCatalogSearchText(searchState.locationSearchText);

        viewState.searchInCatalog(searchState.locationSearchText);
        handleClick && handleClick();
      }}
    >
      <Box paddedRatio={2} rounded charcoalGreyBg>
        <StyledIcon styledWidth={"14px"} glyph={Icon.GLYPHS["dataCatalog"]} />
        <Spacing right={2} />
        <Text textAlignLeft textLight large fullWidth>
          {t("search.searchInDataCatalog", {
            locationSearchText: locationSearchText
          })}
        </Text>
        <StyledIcon glyph={Icon.GLYPHS.right2} styledWidth={"14px"} light />
      </Box>
    </RawButton>
  );
}

SearchInDataCatalog.propTypes = {
  handleClick: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};

const PresentationBox = styled(Box).attrs({
  fullWidth: true
})`
  ${(props) =>
    // @ts-expect-error TS(2339): Property 'highlightBottom' does not exist on type ... Remove this comment to see the full error message
    props.highlightBottom &&
    `
      // styled-components doesn't seem to prefix linear-gradient.. soo
      background-image: linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -o-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -moz-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -webkit-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -ms-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
    `}
`;

export const LOCATION_SEARCH_INPUT_NAME = "LocationSearchInput";

export class SearchBoxAndResultsRaw extends React.Component {
  _nowViewingChangeSubscription: any;
  locationSearchRef: any;
  constructor(props: any) {
    super(props);
    this.locationSearchRef = React.createRef();
  }

  componentDidMount() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.updateAppRef(
      LOCATION_SEARCH_INPUT_NAME,
      this.locationSearchRef
    );
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
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      () => this.props.terria.workbench.items,
      () => {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
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

  changeSearchText(newText: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.locationSearchText = newText;
    });

    if (newText.length === 0) {
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      removeMarker(this.props.terria);
      runInAction(() => {
        this.toggleShowLocationSearchResults(false);
      });
    }
    if (
      newText.length > 0 &&
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      !this.props.viewState.searchState.showLocationSearchResults
    ) {
      runInAction(() => {
        this.toggleShowLocationSearchResults(true);
      });
    }
  }

  search() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.searchState.searchLocations();
  }

  toggleShowLocationSearchResults(bool: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showLocationSearchResults = bool;
    });
  }

  startLocationSearch() {
    this.toggleShowLocationSearchResults(true);
  }

  render() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const { viewState, placeholder } = this.props;
    const searchState = viewState.searchState;
    const locationSearchText = searchState.locationSearchText;

    const shouldShowResults =
      searchState.locationSearchText.length > 0 &&
      searchState.showLocationSearchResults;

    return (
      <Text textDarker>
        <Box fullWidth>
          // @ts-expect-error TS(2769): No overload matches this call.
          <PresentationBox highlightBottom={shouldShowResults}>
            <SearchBox
              ref={this.locationSearchRef}
              onSearchTextChanged={this.changeSearchText.bind(this)}
              onDoSearch={this.search.bind(this)}
              onFocus={this.startLocationSearch.bind(this)}
              searchText={searchState.locationSearchText}
              placeholder={placeholder}
            />
          </PresentationBox>
          {/* Results */}
          {shouldShowResults && (
            <Box
              position="absolute"
              fullWidth
              column
              css={`
                top: 100%;
                background-color: ${(props: any) => props.theme.greyLightest};
                max-height: calc(100vh - 120px);
                border-radius: 0 0 ${(props: any) => props.theme.radius40Button}px
                  ${(props: any) => props.theme.radius40Button}px;
              `}
            >
              {/* search {searchterm} in data catalog */}
              {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
              {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              {this.props.terria.searchBarModel.showSearchInCatalog &&
                searchState.catalogSearchProvider && (
                  <Box column paddedRatio={2}>
                    <SearchInDataCatalog
                      viewState={viewState}
                      handleClick={() => {
                        this.toggleShowLocationSearchResults(false);
                      }}
                    />
                  </Box>
                )}
              <Box
                column
                css={`
                  overflow-y: auto;
                `}
              >
                // @ts-expect-error TS(2741): Property 'theme' is missing in type. Remove this comment to see the full error message
                {searchState.locationSearchResults.map((search: any) => <LocationSearchResults
                  key={search.searchProvider.uniqueId}
                  // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                  terria={this.props.terria}
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  viewState={this.props.viewState}
                  search={search}
                  locationSearchText={locationSearchText}
                  onLocationClick={(result) => {
                    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                    addMarker(this.props.terria, result);
                    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
                    result.clickAction();
                    runInAction(() => {
                      searchState.showLocationSearchResults = false;
                    });
                  }}
                  isWaitingForSearchToStart={
                    searchState.isWaitingToStartLocationSearch
                  }
                />)}
              </Box>
            </Box>
          )}
        </Box>
      </Text>
    );
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
SearchBoxAndResultsRaw.propTypes = {
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired,
  placeholder: PropTypes.string.isRequired
};

export default observer(SearchBoxAndResultsRaw);
