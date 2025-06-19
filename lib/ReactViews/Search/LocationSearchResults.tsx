/**
  Initially this was written to support various location search providers in master,
  however we only have a single location provider at the moment, and how we merge
  them in the new design is yet to be resolved, see:
  https://github.com/TerriaJS/nsw-digital-twin/issues/248#issuecomment-599919318
 */

import { observer } from "mobx-react";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import isDefined from "../../Core/isDefined";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import SearchResultModel from "../../Models/SearchProviders/SearchResult";
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
  ${(p) => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
    ${StyledIcon} {
      fill-opacity: 1;
    }
  }`}
`;

interface LocationSearchResultsProps {
  viewState: ViewState;
  isWaitingForSearchToStart: boolean;
  terria: Terria;
  search: SearchProviderResults;
  onLocationClick: (result: SearchResultModel) => void;
  locationSearchText: string;
}

const LocationSearchResults: React.FC<LocationSearchResultsProps> = observer(
  (props: LocationSearchResultsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
      setIsExpanded((prev) => !prev);
    };

    const validResults = useMemo(() => {
      const { search, terria } = props;
      const locationSearchBoundingBox = terria.searchBarModel.boundingBoxLimit;
      let filterResults = false;
      let west: number | undefined,
        east: number | undefined,
        south: number | undefined,
        north: number | undefined;
      if (locationSearchBoundingBox) {
        ({ west, east, south, north } = locationSearchBoundingBox);

        filterResults =
          isDefined(west) &&
          isDefined(east) &&
          isDefined(south) &&
          isDefined(north);
      }

      const validResults = filterResults
        ? search.results.filter(function (r: any) {
            return (
              r.location.longitude > west! &&
              r.location.longitude < east! &&
              r.location.latitude > south! &&
              r.location.latitude < north!
            );
          })
        : search.results;
      return validResults;
    }, [props]);

    const { search } = props;
    const searchProvider: LocationSearchProviderMixin.Instance =
      search.searchProvider as unknown as LocationSearchProviderMixin.Instance;

    const maxResults = searchProvider.recommendedListLength || 5;
    const results =
      validResults.length > maxResults
        ? isExpanded
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
              length={validResults?.length}
              isOpen={isOpen}
              search={search}
              isWaitingForSearchToStart={props.isWaitingForSearchToStart}
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
                isWaitingForSearchToStart={props.isWaitingForSearchToStart}
              />
              <Ul column fullWidth>
                {results.map((result: SearchResultModel, i: number) => (
                  <SearchResult
                    key={i}
                    clickAction={props.onLocationClick.bind(null, result)}
                    name={result.name}
                    icon="location2"
                    locationSearchText={props.locationSearchText}
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
                  <RawButton onClick={toggleExpand}>
                    <TextSpan small isLink>
                      <SearchResultsFooter
                        isExpanded={isExpanded}
                        name={searchProvider.name}
                      />
                    </TextSpan>
                  </RawButton>
                </BoxSpan>
              )}
            </>
          )}
        </Text>
      </Box>
    );
  }
);

interface SearchResultsFooterProps {
  isExpanded: boolean;
  name: string;
}

const SearchResultsFooter: FC<SearchResultsFooterProps> = (
  props: SearchResultsFooterProps
) => {
  const { t, i18n } = useTranslation();
  if (props.isExpanded) {
    return t("search.viewLess", {
      name: applyTranslationIfExists(props.name, i18n)
    });
  }
  return t("search.viewMore", {
    name: applyTranslationIfExists(props.name, i18n)
  });
};

interface NameWithLoaderProps {
  name: string;
  length?: number;
  isOpen: boolean;
  search: SearchProviderResults;
  isWaitingForSearchToStart: boolean;
}

const NameWithLoader: FC<NameWithLoaderProps> = observer(
  (props: NameWithLoaderProps) => {
    const { i18n } = useTranslation();
    return (
      <BoxSpan styledHeight={"25px"}>
        <BoxSpan verticalCenter>
          <TextSpan textDarker uppercase>
            {`${applyTranslationIfExists(props.name, i18n)} (${
              props.length || 0
            })`}
          </TextSpan>
        </BoxSpan>
        {!props.isOpen &&
          (props.search.isSearching || props.isWaitingForSearchToStart) && (
            <Loader hideMessage boxProps={{ fullWidth: false }} />
          )}
      </BoxSpan>
    );
  }
);
export default LocationSearchResults;
