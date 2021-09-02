/**
  Initially this was written to support various location search providers in master,
  however we only have a single location provider at the moment, and how we merge
  them in the new design is yet to be resolved, see:
  https://github.com/TerriaJS/nsw-digital-twin/issues/248#issuecomment-599919318
 */

import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import {
  useTranslation,
  withTranslation,
  WithTranslation
} from "react-i18next";
import styled, { DefaultTheme } from "styled-components";
import isDefined from "../../Core/isDefined";
import { useTranslationIfExists } from "../../Language/languageHelpers";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Ul from "../../Styled/List";
import Text, { TextSpan } from "../../Styled/Text";
import Loader from "../Loader";
import SearchHeader from "./SearchHeader";
import SearchResult from "./SearchResult";

const RawButtonAndHighlight = styled(RawButton)`
  ${p => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
    ${StyledIcon} {
      fill-opacity: 1;
    }
  }`}
`;

interface PropsType extends WithTranslation {
  viewState: ViewState;
  isWaitingForSearchToStart: boolean;
  terria: Terria;
  search: SearchProviderResults;
  onLocationClick: () => void;
  theme: DefaultTheme;
  locationSearchText: string;
}

@observer
class LocationSearchResults extends React.Component<PropsType> {
  @observable isExpanded = false;

  @action.bound
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  @computed
  get validResults() {
    const { search, terria } = this.props;
    const locationSearchBoundingBox =
      terria.configParameters.searchBar?.boundingBoxLimit;
    const validResults = isDefined(locationSearchBoundingBox)
      ? search.results.filter(function(r: any) {
          return (
            r.location.longitude > locationSearchBoundingBox[0] &&
            r.location.longitude < locationSearchBoundingBox[2] &&
            r.location.latitude > locationSearchBoundingBox[1] &&
            r.location.latitude < locationSearchBoundingBox[3]
          );
        })
      : search.results;
    return validResults;
  }

  render() {
    const { search } = this.props;
    const searchProvider: LocationSearchProviderMixin.LocationSearchProviderMixin = search.searchProvider as any;

    const maxResults = searchProvider.recommendedListLength || 5;
    const validResults = this.validResults;
    const results =
      validResults.length > maxResults
        ? this.isExpanded
          ? validResults
          : validResults.slice(0, maxResults)
        : validResults;
    const isOpen = searchProvider.isOpen;
    return (
      <Box column>
        <RawButtonAndHighlight
          type="button"
          fullWidth
          onClick={() => searchProvider.toggleOpen()}
        >
          <BoxSpan
            paddedRatio={2}
            paddedVertically={3}
            centered
            justifySpaceBetween
          >
            <NameWithLoader
              name={search.searchProvider.name}
              length={this.validResults?.length}
              isOpen={isOpen}
              search={search}
              isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}
            />
            <StyledIcon
              styledWidth={"9px"}
              glyph={isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
            />
          </BoxSpan>
        </RawButtonAndHighlight>
        <Text textDarker>
          {isOpen && (
            <>
              <SearchHeader
                searchResults={search}
                isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}
              />
              <Ul>
                {results.map((result: any, i: number) => (
                  <SearchResult
                    key={i}
                    clickAction={this.props.onLocationClick.bind(null, result)}
                    name={result.name}
                    icon="location2"
                    locationSearchText={this.props.locationSearchText}
                    isLastResult={results.length === i + 1}
                  />
                ))}
              </Ul>
              {validResults.length > maxResults && (
                <BoxSpan
                  paddedRatio={2}
                  paddedVertically={3}
                  left
                  justifySpaceBetween
                >
                  <RawButton onClick={this.toggleExpand}>
                    <Text small isLink>
                      <SearchResultsFooter
                        isExpanded={this.isExpanded}
                        name={searchProvider.name}
                      />
                    </Text>
                  </RawButton>
                </BoxSpan>
              )}
            </>
          )}
        </Text>
      </Box>
    );
  }
}

interface SearchResultsFooterProps {
  isExpanded: boolean;
  name: string;
}

const SearchResultsFooter: React.FC<SearchResultsFooterProps> = (
  props: SearchResultsFooterProps
) => {
  const { t } = useTranslation();
  if (props.isExpanded) {
    return t("search.viewLess", {
      name: props.name
    });
  }
  return t("search.viewMore", {
    name: props.name
  });
};

interface NameWithLoaderProps {
  name: string;
  length?: number;
  isOpen: boolean;
  search: SearchProviderResults;
  isWaitingForSearchToStart: boolean;
}

const NameWithLoader: React.FC<NameWithLoaderProps> = observer(
  (props: NameWithLoaderProps) => (
    <BoxSpan styledHeight={"25px"}>
      <BoxSpan verticalCenter>
        <TextSpan textDarker uppercase>{`${useTranslationIfExists(
          props.name
        )} (${props.length || 0})`}</TextSpan>
      </BoxSpan>
      {!props.isOpen &&
        (props.search.isSearching || props.isWaitingForSearchToStart) && (
          <Loader hideMessage boxProps={{ fullWidth: false }} />
        )}
    </BoxSpan>
  )
);
export default withTranslation()(LocationSearchResults);
