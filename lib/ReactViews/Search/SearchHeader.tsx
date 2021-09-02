import { observer } from "mobx-react";
import React from "react";
import { useTranslationIfExists } from "../../Language/languageHelpers";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import { BoxSpan } from "../../Styled/Box";
import Text from "../../Styled/Text";
import Loader from "../Loader";

interface SearchHeaderProps {
  searchResults: SearchProviderResults;
  isWaitingForSearchToStart: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = observer(
  (props: SearchHeaderProps) => {
    if (props.searchResults.isSearching || props.isWaitingForSearchToStart) {
      return (
        <div key="loader">
          <Loader boxProps={{ padded: true }} />
        </div>
      );
    } else if (props.searchResults.message) {
      return (
        <BoxSpan paddedRatio={2}>
          <Text key="message">
            {useTranslationIfExists(
              props.searchResults.message.content,
              props.searchResults.message.params
            )}
          </Text>
        </BoxSpan>
      );
    } else {
      return null;
    }
  }
);

export default SearchHeader;
